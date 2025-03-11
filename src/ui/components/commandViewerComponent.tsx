import { Platform } from "obsidian";
import { createContext, h } from "preact";
import { useState } from "react";
import { ReactSortable } from "react-sortablejs";
import {
	SlashCommand,
	isCommandGroup,
	isCommandActive,
	isParentCommand,
	isDeviceValid,
} from "@/data/models/SlashCommand";
import CommandStore from "@/data/stores/CommandStore";
import SlashCommanderPlugin from "@/main";
import CommandComponent from "@/ui/components/commandComponent";
import ObsidianIcon from "@/ui/components/obsidianIconComponent";
import t from "@/i18n";
import ChooseIconModal from "@/ui/modals/chooseIconModal";
import ConfirmDeleteModal from "@/ui/modals/confirmDeleteModal";
import { chooseNewCommand } from "@/services/utils/util";

export const CommandStoreContext = createContext<CommandStore>(null!);

interface CommandViewerProps {
	manager: CommandStore;
	plugin: SlashCommanderPlugin;
}

export default function CommandViewer({ manager, plugin }: CommandViewerProps): h.JSX.Element {
	// State of the root component
	const [, setState] = useState(manager.data);

	return (
		<CommandStoreContext.Provider value={manager}>
			<div className="cmdr-command-viewer">
				<SortableCommandList plugin={plugin} commands={manager.data} setState={setState} />
			</div>
			{!manager.data.some(
				pre => isCommandActive(plugin, pre) || pre.mode?.match(/mobile|desktop/)
			) && (
				<div class="cmdr-commands-empty">
					<h3>{t("No commands here!")}</h3>
					<span>{t("Would you like to add one now?")}</span>
				</div>
			)}

			{Platform.isMobile && <hr />}

			<CommandViewerTools plugin={plugin} manager={manager} setState={setState} />
		</CommandStoreContext.Provider>
	);
}

interface SortableCommandListProps {
	plugin: SlashCommanderPlugin;
	commands: SlashCommand[];
	setState: (commands: SlashCommand[]) => void;
}

/**
 * Render a sortable list of command components.
 * @param plugin - The plugin instance.
 * @param commands - The commands to render.
 * @param setState - The state updater function.
 * @returns The rendered sortable command list.
 */
function SortableCommandList({
	plugin,
	commands,
	setState,
}: SortableCommandListProps): h.JSX.Element {
	return (
		<ReactSortable
			list={commands}
			setList={(newState): void => setState(newState)}
			group={"root"}
			delay={100}
			delayOnTouchOnly={true}
			animation={200}
			forceFallback={true}
			swapThreshold={0.7}
			fallbackClass="sortable-fallback"
			dragClass="cmdr-sortable-drag"
			ghostClass="cmdr-sortable-ghost"
			onSort={({ oldIndex, newIndex, from, to }): void => {
				if (oldIndex === undefined || newIndex === undefined) return;
				if (from === to) {
					const [removed] = commands.splice(oldIndex, 1);
					commands.splice(newIndex, 0, removed);
					plugin.saveSettings();
					setState(commands);
				}
			}}
		>
			{commands.map(cmd => {
				return isCommandGroup(cmd) && cmd.children ? (
					<CollapsibleCommandGroup
						cmd={cmd}
						plugin={plugin}
						parentCommands={commands}
						setState={setState}
					/>
				) : (
					<CommandListItem
						cmd={cmd}
						plugin={plugin}
						commands={commands}
						setState={setState}
					/>
				);
			})}
		</ReactSortable>
	);
}

/**
 * Render a collapsible command group if the command is a group, otherwise render a command list item.
 * This component should not parent any sortable list.
 * @param cmd - The command to render.
 * @param plugin - The plugin instance.
 * @param parentCommands - The parent commands.
 * @param setState - The state updater function.
 * @returns The rendered command group or command list item.
 */
function CollapsibleCommandGroup({
	cmd,
	plugin,
	parentCommands,
	setState,
}: {
	cmd: SlashCommand;
	plugin: SlashCommanderPlugin;
	parentCommands: SlashCommand[];
	setState: (commands: SlashCommand[]) => void;
}): h.JSX.Element {
	const [collapsed, setCollapsed] = useState(false);
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const subcommands = cmd.children!;

	return (
		<div className="cmdr-group-collapser" aria-expanded={!collapsed}>
			<CommandListItem
				cmd={cmd}
				plugin={plugin}
				commands={subcommands}
				setState={setState}
				isCollapsed={collapsed}
				onCollapse={(): void => setCollapsed(!collapsed)}
			/>
			<ReactSortable
				list={subcommands}
				setList={(newState): void => setState(newState)}
				group={"root"}
				delay={100}
				delayOnTouchOnly={true}
				animation={200}
				forceFallback={true}
				swapThreshold={0.7}
				fallbackClass="sortable-fallback"
				className="cmdr-group-collapser-content"
				dragClass="cmdr-sortable-drag"
				ghostClass="cmdr-sortable-ghost"
				onSort={({ oldIndex, newIndex, from, to }): void => {
					if (oldIndex === undefined || newIndex === undefined) return;

					// Moving within the same child list
					if (from === to) {
						const [removed] = subcommands.splice(oldIndex, 1);
						subcommands.splice(newIndex, 0, removed);
					}
					// Moving from child to parent list
					else if (from.classList.contains("cmdr-group-collapser-content")) {
						const [removed] = subcommands.splice(oldIndex, 1);
						parentCommands.splice(newIndex, 0, removed);
					}
					// Moving from parent to child list
					else if (to.classList.contains("cmdr-group-collapser-content")) {
						const [removed] = parentCommands.splice(oldIndex, 1);
						subcommands.splice(newIndex, 0, removed);
					}

					plugin.saveSettings();
					setState(parentCommands);
				}}
			>
				{subcommands.map(cmd => {
					return (
						<CommandListItem
							cmd={cmd}
							plugin={plugin}
							commands={subcommands}
							setState={setState}
						/>
					);
				})}
			</ReactSortable>
		</div>
	);
}

/**
 * Render a command list item if the command is visible.
 * @param cmd - The command to render.
 * @param plugin - The plugin instance.
 * @param commands - The commands to render.
 * @param setState - The state updater function.
 * @returns The rendered command list item or null if the command is not visible.
 */
function CommandListItem({
	cmd,
	plugin,
	commands,
	setState,
	isCollapsed,
	onCollapse,
}: {
	cmd: SlashCommand;
	plugin: SlashCommanderPlugin;
	commands: SlashCommand[];
	setState: (commands: SlashCommand[]) => void;
	isCollapsed?: boolean;
	onCollapse?: () => void;
}): h.JSX.Element | null {
	if (!isDeviceValid(plugin, cmd.mode)) {
		return null;
	}

	const saveAndUpdate = async (): Promise<void> => {
		await plugin.saveSettings();
		plugin.commandStore.reorder();
		setState([...commands]);
	};

	return (
		<CommandComponent
			plugin={plugin}
			key={cmd.id}
			pair={cmd}
			handleRemove={async (): Promise<void> => {
				if (
					!plugin.settings.confirmDeletion ||
					(await new ConfirmDeleteModal(plugin).didChooseRemove())
				) {
					commands.remove(cmd);
					await saveAndUpdate();
				}
			}}
			handleRename={async (name): Promise<void> => {
				cmd.name = name;
				await saveAndUpdate();
			}}
			handleNewIcon={async (): Promise<void> => {
				const newIcon = await new ChooseIconModal(plugin).awaitSelection();
				if (newIcon && newIcon !== cmd.icon) {
					cmd.icon = newIcon;
					await saveAndUpdate();
				}
				dispatchEvent(new Event("cmdr-icon-changed"));
			}}
			handleDeviceModeChange={async (mode?: string): Promise<void> => {
				const modes = ["any", "desktop", "mobile", plugin.app.appId];
				const nextIndex = (modes.indexOf(cmd.mode ?? "any") + 1) % modes.length;
				cmd.mode = mode || modes[nextIndex];
				await saveAndUpdate();
			}}
			handleTriggerModeChange={async (mode?: string): Promise<void> => {
				const modes = ["anywhere", "newline", "inline"];
				const nextIndex = (modes.indexOf(cmd.triggerMode ?? "anywhere") + 1) % modes.length;
				cmd.triggerMode = mode || modes[nextIndex];
				await saveAndUpdate();
			}}
			handleAddChild={
				isParentCommand(cmd)
					? (): void => {
							// TODO: Add child command
						}
					: undefined
			}
			isCollapsed={isCollapsed}
			handleCollapse={onCollapse}
		/>
	);
}

/**
 * Render the command list tools (full version).
 * @param plugin - The plugin instance.
 * @param manager - The command manager instance.
 * @param setState - The state updater function.
 * @returns The rendered command list tools.
 */
function CommandViewerTools({
	plugin,
	manager,
	setState,
}: {
	plugin: SlashCommanderPlugin;
	manager: CommandStore;
	setState: (commands: SlashCommand[]) => void;
}): h.JSX.Element {
	return (
		<div className="cmdr-add-new-wrapper">
			<button
				className="mod-cta"
				onClick={async (): Promise<void> => {
					const pair = await chooseNewCommand(plugin);
					await manager.addCommand(pair);
					manager.reorder();
					setState(manager.data);
					this.forceUpdate();
				}}
			>
				{t("Add command")}
			</button>
			<ObsidianIcon
				className="cmdr-icon clickable-icon"
				icon="rotate-ccw"
				size="var(--icon-m)"
				aria-label={t("Restore default")}
				onClick={async (): Promise<void> => {
					manager.restoreDefault();
					manager.reorder();
					setState(manager.data);
				}}
			/>
		</div>
	);
}

/**
 * Render the command list tools (short version).
 * @param plugin - The plugin instance.
 * @param manager - The command manager instance.
 * @param setState - The state updater function.
 * @returns The rendered command list tools short.
 */
function CommandViewerToolsShort({
	plugin,
	manager,
	setState,
}: {
	plugin: SlashCommanderPlugin;
	manager: CommandStore;
	setState: (commands: SlashCommand[]) => void;
}): h.JSX.Element {
	return (
		<div className="cmdr-add-new-wrapper">
			<ObsidianIcon
				className="cmdr-icon clickable-icon"
				icon="plus-circle"
				size="var(--icon-m)"
				aria-label={t("Add command")}
				onClick={async (): Promise<void> => {
					const pair = await chooseNewCommand(plugin);
					await manager.addCommand(pair);
					manager.reorder();
					setState(manager.data);
					this.forceUpdate();
				}}
			/>
			<ObsidianIcon
				className="cmdr-icon clickable-icon"
				icon="rotate-ccw"
				size="var(--icon-m)"
				aria-label={t("Restore default")}
				onClick={async (): Promise<void> => {
					manager.restoreDefault();
					manager.reorder();
					setState(manager.data);
				}}
			/>
		</div>
	);
}
