import { ReactElement } from "react";
import { SlashCommand, isParentCommand, isDeviceValid } from "@/data/models/SlashCommand";
import { CommandComponent } from "@/ui/viewer/CommandComponent";
import ChooseIconModal from "@/ui/modals/chooseIconModal";
import ConfirmDeleteModal from "@/ui/modals/confirmDeleteModal";
import { usePlugin, useCommandStore } from "@/data/hooks/useCommandStore";

export interface CommandViewerItemProps {
	cmd: SlashCommand;
	isCollapsed?: boolean;
	onCollapse?: () => void;
	isGroupDragging?: boolean;
}

/**
 * Render a command viewer item if the command is visible.
 * This component is used both for regular display and as drag overlay.
 * Uses Zustand store for accessing commands and update functions.
 */
export function CommandViewerItem({
	cmd,
	isCollapsed,
	onCollapse,
	isGroupDragging,
}: CommandViewerItemProps): ReactElement | null {
	const plugin = usePlugin();
	const syncCommands = useCommandStore(state => state.syncCommands);

	// Skip rendering if command is not valid for current device or plugin is not available
	if (!plugin || !isDeviceValid(plugin, cmd.mode)) {
		return null;
	}

	return (
		<div className="cmdr-command-item">
			<CommandComponent
				pair={cmd}
				plugin={plugin}
				handleRemove={async (): Promise<void> => {
					const confirmed = await new ConfirmDeleteModal(plugin, cmd, () =>
						syncCommands()
					).didChooseRemove();
					if (confirmed) {
						// 删除操作已在 didChooseRemove 中处理
						// 这里不需要额外操作
					}
				}}
				handleNewIcon={(): void => {
					new ChooseIconModal(plugin, cmd, () => syncCommands()).open();
				}}
				handleRename={(name): void => {
					cmd.name = name;
					syncCommands();
				}}
				handleDeviceModeChange={(mode?: string): void => {
					const modes = ["any", "desktop", "mobile", plugin.app.appId];
					const nextIndex = (modes.indexOf(cmd.mode ?? "any") + 1) % modes.length;
					cmd.mode = mode || modes[nextIndex];
					syncCommands();
				}}
				handleTriggerModeChange={(mode?: string): void => {
					const modes = ["anywhere", "newline", "inline"];
					const nextIndex =
						(modes.indexOf(cmd.triggerMode ?? "anywhere") + 1) % modes.length;
					cmd.triggerMode = mode || modes[nextIndex];
					syncCommands();
				}}
				isCollapsed={isCollapsed}
				handleCollapse={onCollapse}
			/>
		</div>
	);
}
