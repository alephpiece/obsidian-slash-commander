import { Notice, Platform } from "obsidian";
import type { ReactElement } from "react";
import SlashCommanderPlugin from "@/main";
import {
	SlashCommand,
	getCommandFromId,
	getCommandSourceName,
	isCommandGroup,
	isRootCommand,
} from "@/data/models/SlashCommand";
import ChangeableText from "@/ui/components/changeableText";
import ObsidianIcon from "@/ui/components/obsidianIconComponent";
import { useTranslation } from "react-i18next";
import { getDeviceModeInfo, getTriggerModeInfo } from "@/services/utils/util";
import BindingEditorModal from "@/ui/modals/BindingEditorModal";

export interface CommandProps {
	plugin: SlashCommanderPlugin;
	pair: SlashCommand;
	handleRemove: () => void;
	handleNewIcon: () => void;
	handleRename: (name: string) => void;
	handleDeviceModeChange: (mode?: string) => void;
	handleTriggerModeChange: (mode?: string) => void;
	handleAddChild?: () => void;
	isCollapsed?: boolean;
	handleCollapse?: () => void;
}

/**
 * Component for rendering a command item with appropriate controls.
 */
export function CommandComponent({
	plugin,
	pair,
	handleRemove,
	handleNewIcon,
	handleRename,
	handleDeviceModeChange,
	handleTriggerModeChange,
	handleAddChild,
	isCollapsed,
	handleCollapse,
}: CommandProps): ReactElement {
	const { t } = useTranslation();
	const cmd = getCommandFromId(plugin, pair.id);
	if (!isCommandGroup(pair) && !cmd) {
		return <UnavailableCommandComponent pair={pair} handleRemove={handleRemove} />;
	}

	// const isChecked =
	// 	cmd.hasOwnProperty("checkCallback") ||
	// 	cmd.hasOwnProperty("editorCheckCallback");

	const { deviceModeIcon, deviceModeName } = getDeviceModeInfo(pair.mode);
	const { triggerModeIcon, triggerModeName } = getTriggerModeInfo(pair.triggerMode);

	return (
		<div className="setting-item mod-toggle">
			<ObsidianIcon
				icon={pair.icon}
				size="var(--icon-l) + 4px"
				aria-label={t("bindings.icon.change")}
				onClick={handleNewIcon}
				className="cmdr-icon clickable-icon"
			/>
			<div className="setting-item-info">
				<div className="setting-item-name">
					<ChangeableText
						ariaLabel={t("bindings.rename.click")}
						handleChange={(e): void => {
							handleRename(e.currentTarget.value);
						}}
						value={pair.name}
					/>
				</div>
				{cmd && Platform.isDesktop && !isCommandGroup(pair) && (
					<div className="setting-item-description">
						{t("bindings.source", {
							plugin_name: getCommandSourceName(plugin, cmd),
						})}
						{pair.name !== cmd.name ? ` "${cmd.name}"` : "."}
						{/* {" "} */}
						{/* {isChecked
								? t(
									"bindings.device_mode.warn"
								)
								: ""} */}
					</div>
				)}
			</div>
			<div className="setting-item-control">
				{isCollapsed !== undefined && handleCollapse && (
					<ObsidianIcon
						icon={isCollapsed ? "chevron-right" : "chevron-down"}
						className="cmdr-group-collapser-button clickable-icon"
						onClick={handleCollapse}
						aria-label={
							isCollapsed ? t("bindings.group.expand") : t("bindings.group.collapse")
						}
					/>
				)}
				{isRootCommand(pair) && handleAddChild && (
					<ObsidianIcon
						icon="plus-circle"
						className="setting-editor-extra-setting-button clickable-icon"
						onClick={handleAddChild}
						aria-label={t("bindings.add_child")}
					/>
				)}
				{Platform.isMobile ? (
					<ObsidianIcon
						icon="pencil"
						className="setting-editor-extra-setting-button clickable-icon"
						onClick={async (): Promise<void> => {
							if (plugin) {
								const updatedCommand = await new BindingEditorModal(
									plugin,
									pair
								).awaitSelection();
								if (updatedCommand) {
									// Apply updates to existing command
									pair.name = updatedCommand.name;
									pair.icon = updatedCommand.icon;
									pair.mode = updatedCommand.mode;
									pair.triggerMode = updatedCommand.triggerMode;

									// Sync changes
									handleRename(updatedCommand.name);
								}
							}
						}}
						aria-label={t("bindings.edit")}
					/>
				) : (
					!isCommandGroup(pair) && (
						<>
							<ObsidianIcon
								icon={triggerModeIcon}
								className="setting-editor-extra-setting-button clickable-icon"
								onClick={(): void => handleTriggerModeChange()}
								aria-label={t("bindings.trigger_mode.change", {
									current_mode: triggerModeName,
								})}
							/>
							<ObsidianIcon
								icon={deviceModeIcon}
								className="setting-editor-extra-setting-button clickable-icon"
								onClick={(): void => handleDeviceModeChange()}
								aria-label={t("bindings.device_mode.change", {
									current_mode: deviceModeName,
								})}
							/>
						</>
					)
				)}
				<ObsidianIcon
					icon="lucide-trash"
					className="setting-editor-extra-setting-button clickable-icon"
					style={{ color: "var(--text-error)" }}
					onClick={handleRemove}
					aria-label={t("common.delete")}
				/>
			</div>
		</div>
	);
}

/**
 * Component for displaying a command that is not available on the current device.
 * @param pair - The command to display.
 * @param handleRemove - The callback to remove the command.
 */
function UnavailableCommandComponent({
	pair,
	handleRemove,
}: {
	pair: SlashCommand;
	handleRemove: () => void;
}): ReactElement {
	const { t } = useTranslation();
	return (
		<div className="setting-item mod-toggle">
			<ObsidianIcon
				icon="alert-triangle"
				size="var(--icon-l) + 4px"
				className="cmdr-icon clickable-icon mod-warning"
			/>
			<div className="setting-item-info">
				<div className="setting-item-name">{pair.name}</div>
				<div className="setting-item-description">
					{t("bindings.device_mode.unavailable")}
				</div>
			</div>
			<div className="setting-item-control">
				<ObsidianIcon
					icon="lucide-trash"
					className="setting-editor-extra-setting-button clickable-icon"
					style={{ color: "var(--text-error)" }}
					onClick={handleRemove}
					aria-label={t("common.delete")}
				/>
			</div>
		</div>
	);
}
