import { ReactElement } from "react";
import SlashCommanderPlugin from "@/main";
import { SlashCommand, isDeviceValid, isParentCommand } from "@/data/models/SlashCommand";
import CommandComponent from "@/ui/components/commandComponent";
import ChooseIconModal from "@/ui/modals/chooseIconModal";
import ConfirmDeleteModal from "@/ui/modals/confirmDeleteModal";

export interface CommandListItemProps {
	cmd: SlashCommand;
	plugin: SlashCommanderPlugin;
	commands: SlashCommand[];
	setState: (commands: SlashCommand[]) => void;
	isCollapsed?: boolean;
	onCollapse?: () => void;
}

/**
 * Render a command list item if the command is visible.
 * @param cmd - The command to render.
 * @param plugin - The plugin instance.
 * @param commands - The commands to render.
 * @param setState - The state updater function.
 * @returns The rendered command list item or null if the command is not visible.
 */
export function CommandListItem({
	cmd,
	plugin,
	commands,
	setState,
	isCollapsed,
	onCollapse,
}: CommandListItemProps): ReactElement | null {
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