import { ReactElement } from "react";
import SlashCommanderPlugin from "@/main";
import { SlashCommand, isDeviceValid, isParentCommand } from "@/data/models/SlashCommand";
import { CommandComponent } from "@/ui/viewer/CommandComponent";
import ChooseIconModal from "@/ui/modals/chooseIconModal";
import ConfirmDeleteModal from "@/ui/modals/confirmDeleteModal";

export interface CommandViewerItemProps {
	cmd: SlashCommand;
	plugin: SlashCommanderPlugin;
	commands: SlashCommand[];
	setState: () => void;
	isCollapsed?: boolean;
	onCollapse?: () => void;
	isGroupDragging?: boolean;
}

/**
 * Render a command viewer item if the command is visible.
 * This component is used both for regular display and as drag overlay.
 */
export function CommandViewerItem({
	cmd,
	plugin,
	commands,
	setState,
	isCollapsed,
	onCollapse,
	isGroupDragging,
}: CommandViewerItemProps): ReactElement | null {
	if (!isDeviceValid(plugin, cmd.mode)) {
		return null;
	}

	const saveAndUpdate = async (): Promise<void> => {
		await plugin.commandStore.commitChanges();
		setState();
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
					// Find and remove the command
					const command = commands.find(c => c.id === cmd.id);
					if (command) {
						await plugin.commandStore.removeCommand(command.id);
						setState();
					}
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