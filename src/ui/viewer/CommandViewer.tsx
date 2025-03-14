import { Platform } from "obsidian";
import { createContext, type ReactElement, useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ReactSortable } from "react-sortablejs";

import { CommandViewerItem } from "@/ui/viewer/CommandViewerItem";
import { CommandTools } from "@/ui/viewer/CommandTools";
import {
	SlashCommand,
	isCommandGroup,
	isCommandActive,
} from "@/data/models/SlashCommand";
import CommandStore from "@/data/stores/CommandStore";
import SlashCommanderPlugin from "@/main";

export const CommandStoreContext = createContext<CommandStore>(null!);

interface CommandViewerProps {
	manager: CommandStore;
	plugin: SlashCommanderPlugin;
}

export function CommandViewer({ manager, plugin }: CommandViewerProps): ReactElement {
	const [commands, setCommands] = useState<SlashCommand[]>(() => manager.getAllCommands());
	const { t } = useTranslation();

	// Subscribe to command store changes
	useEffect(() => {
		const handleStoreChange = (newCommands: SlashCommand[]): void => {
			setCommands([...newCommands]);
		};
		
		// Subscribe to changes
		const unsubscribe = manager.on('changed', handleStoreChange);
		
		// Cleanup subscription on unmount
		return () => {
			unsubscribe();
		};
	}, [manager]);

	// Update state and commit changes to store
	const updateCommands = useCallback((newCommands: SlashCommand[]): void => {
		setCommands([...newCommands]);
		manager.updateStructure(newCommands);
	}, [manager]);

	// Sync with store
	const syncWithStore = useCallback((): void => {
		manager.commitChanges();
	}, [manager]);

	return (
		<CommandStoreContext.Provider value={manager}>
			<div className="cmdr-command-viewer">
				<SortableCommandList 
					plugin={plugin} 
					commands={commands} 
					setState={updateCommands} 
				/>
			</div>
			{!commands.some(
				(pre) => isCommandActive(plugin, pre) || pre.mode?.match(/mobile|desktop/)
			) && (
				<div className="cmdr-commands-empty">
					<h3>{t("bindings.no_command.detail")}</h3>
					<span>{t("bindings.no_command.add_now")}</span>
				</div>
			)}

			{Platform.isMobile && <hr />}

			<CommandTools plugin={plugin} manager={manager} setState={syncWithStore} />
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
}: SortableCommandListProps): ReactElement {
	return (
		<ReactSortable
			list={commands}
			setList={(newState): void => setState(newState)}
			group="root"
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
				return isCommandGroup(cmd) ? (
					<CollapsibleCommandGroup
						key={cmd.id}
						cmd={cmd}
						plugin={plugin}
						parentCommands={commands}
						setState={setState}
					/>
				) : (
					<CommandViewerItem
						key={cmd.id}
						cmd={cmd}
						plugin={plugin}
						commands={commands}
						setState={(): void => syncCommands(plugin, commands, setState)}
					/>
				);
			})}
		</ReactSortable>
	);
}

interface CollapsibleCommandGroupProps {
	cmd: SlashCommand;
	plugin: SlashCommanderPlugin;
	parentCommands: SlashCommand[];
	setState: (commands: SlashCommand[]) => void;
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
}: CollapsibleCommandGroupProps): ReactElement {
	const [collapsed, setCollapsed] = useState(false);
	const childCommands = parentCommands.filter(c => c.parentId === cmd.id);

	return (
		<div className="cmdr-group-collapser" aria-expanded={!collapsed}>
			<CommandViewerItem
				cmd={cmd}
				plugin={plugin}
				commands={childCommands}
				setState={(): void => syncCommands(plugin, parentCommands, setState)}
				isCollapsed={collapsed}
				onCollapse={(): void => setCollapsed(!collapsed)}
			/>
			<ReactSortable
				list={childCommands}
				setList={(newState): void => setState(newState)}
				group="root"
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
						const [removed] = childCommands.splice(oldIndex, 1);
						childCommands.splice(newIndex, 0, removed);
					}
					// Moving from child to parent list
					else if (from.classList.contains("cmdr-group-collapser-content")) {
						const [removed] = childCommands.splice(oldIndex, 1);
						parentCommands.splice(newIndex, 0, removed);
					}
					// Moving from parent to child list
					else if (to.classList.contains("cmdr-group-collapser-content")) {
						const [removed] = parentCommands.splice(oldIndex, 1);
						childCommands.splice(newIndex, 0, removed);
					}

					plugin.saveSettings();
					setState(parentCommands);
				}}
			>
				{childCommands.map(cmd => (
					<CommandViewerItem
						key={cmd.id}
						cmd={cmd}
						plugin={plugin}
						commands={childCommands}
						setState={(): void => syncCommands(plugin, parentCommands, setState)}
					/>
				))}
			</ReactSortable>
		</div>
	);
}

/**
 * Helper function to sync commands with the plugin settings
 */
function syncCommands(
	plugin: SlashCommanderPlugin, 
	commands: SlashCommand[], 
	setState: (commands: SlashCommand[]) => void
): void {
	plugin.saveSettings();
	setState([...commands]);
}