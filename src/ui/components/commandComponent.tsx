import { Notice, Platform } from "obsidian";
import type { ReactElement } from "react";
import SlashCommanderPlugin from "@/main";
import {
	SlashCommand,
	getCommandFromId,
	getCommandSourceName,
	isCommandGroup,
} from "@/data/models/SlashCommand";
import ChangeableText from "@/ui/components/changeableText";
import ObsidianIcon from "@/ui/components/obsidianIconComponent";
import MobileModifyModal from "@/ui/modals/mobileModifyModal";
import { useTranslation } from "react-i18next";

interface CommandProps {
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

export default function CommandComponent({
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

	if (Platform.isDesktop) {
		return (
			<div className="setting-item mod-toggle">
				<ObsidianIcon
					icon={pair.icon}
					size="var(--icon-m)"
					aria-label={t("bindings.icon.change")}
					onClick={handleNewIcon}
					className="cmdr-icon clickable-icon"
				/>
				<div className="setting-item-info">
					<div className="setting-item-name">
						<ChangeableText
							ariaLabel={t("bindings.rename.doubleclick")}
							handleChange={(e): void => {
								handleRename(e.currentTarget.value);
							}}
							value={pair.name}
						/>
					</div>
					{cmd && (
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
							aria-label={isCollapsed ? t("bindings.group.expand") : t("bindings.group.collapse")}
						/>
					)}
					{handleAddChild && (
						<ObsidianIcon
							icon="plus-circle"
							className="setting-editor-extra-setting-button clickable-icon"
							onClick={handleAddChild}
							aria-label={t("bindings.add_child")}
						/>
					)}
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
					<button
						className="mod-warning"
						style={{ display: "flex" }}
						onClick={handleRemove}
						aria-label={t("common.delete")}
					>
						<ObsidianIcon icon="lucide-trash" />
					</button>
				</div>
			</div>
		);
	} else if (Platform.isMobile) {
		const openMobileModifyModal = (): void => {
			new MobileModifyModal(
				plugin,
				pair,
				handleRename,
				handleNewIcon,
				handleDeviceModeChange,
				handleTriggerModeChange
			).open();
		};

		return (
			<div className="mobile-option-setting-item">
				<span className="mobile-option-setting-item-remove-icon" onClick={handleRemove}>
					<ObsidianIcon
						icon="minus-with-circle"
						size="var(--icon-l)"
						style={{ color: "var(--text-error)" }}
					/>
				</span>
				<span className="mobile-option-setting-item-option-icon">
					<ObsidianIcon
						icon={pair.icon}
						size="var(--icon-l)"
						onClick={openMobileModifyModal}
					/>
				</span>
				<span className="mobile-option-setting-item-name" onClick={openMobileModifyModal}>
					{pair.name}
				</span>
				<span className="mobile-option-setting-item-option-icon">
					<ObsidianIcon
						icon="three-horizontal-bars"
						className="clickable-icon"
						onClick={openMobileModifyModal}
					/>
				</span>
			</div>
		);
	} else {
		return <></>;
	}
}

/**
 * Get the icon and name for the device mode.
 * @param mode - The device mode to get the icon and name for.
 */
function getDeviceModeInfo(mode = "any"): { deviceModeIcon: string; deviceModeName: string } {
	const { t } = useTranslation();
	const icons: { [iconName: string]: string } = {
		mobile: "smartphone",
		desktop: "monitor",
		any: "cmdr-all-devices",
	};
	const deviceModeIcon = icons[mode] ?? "airplay";
	const deviceModeName = mode.match(/desktop|mobile|any/)
		? t(`bindings.device_mode.${mode}`)
		: t("bindings.device_mode.this");

	return { deviceModeIcon, deviceModeName };
}

/**
 * Get the icon and name for the trigger mode.
 * @param mode - The trigger mode to get the icon and name for.
 */
function getTriggerModeInfo(mode = "anywhere"): {
	triggerModeIcon: string;
	triggerModeName: string;
} {
	const { t } = useTranslation();
	const icons: { [iconName: string]: string } = {
		newline: "cmdr-triggered-newline",
		inline: "cmdr-triggered-inline",
		anywhere: "regex",
	};
	const triggerModeIcon = icons[mode] ?? "regex";
	const triggerModeName = t(`bindings.trigger_mode.${mode}`);

	return { triggerModeIcon, triggerModeName };
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
	if (Platform.isDesktop) {
		return (
			<div className="setting-item mod-toggle">
				<ObsidianIcon
					icon="alert-triangle"
					size="var(--icon-m)"
					className="cmdr-icon clickable-icon mod-warning"
				/>
				<div className="setting-item-info">
					<div className="setting-item-name">{pair.name}</div>
					<div className="setting-item-description">
						{t("bindings.device_mode.unavailable")}
					</div>
				</div>
				<div className="setting-item-control">
					<button
						className="mod-warning"
						style={{ display: "flex" }}
						onClick={handleRemove}
						aria-label={t("common.delete")}
					>
						<ObsidianIcon icon="lucide-trash" />
					</button>
				</div>
			</div>
		);
	} else if (Platform.isMobile) {
		return (
			<div
				className="mobile-option-setting-item"
				onClick={(): void => {
					new Notice(t("bindings.device_mode.unavailable"));
				}}
			>
				<span className="mobile-option-setting-item-remove-icon" onClick={handleRemove}>
					<ObsidianIcon
						icon="minus-with-circle"
						size="var(--icon-l)"
						style={{ color: "var(--text-error)" }}
					/>
				</span>
				<span className="mobile-option-setting-item-option-icon mod-warning">
					<ObsidianIcon icon="alert-triangle" size="var(--icon-l)" />
				</span>
				<span className="mobile-option-setting-item-name">{pair.name}</span>
			</div>
		);
	} else {
		return <></>;
	}
}
