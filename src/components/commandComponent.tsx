import { Notice, Platform } from "obsidian";
import { Fragment, h } from "preact";
import t from "src/l10n";
import SlashCommanderPlugin from "src/main";
import { CommandIconPair } from "src/types";
import { getCommandFromId, ObsidianIcon, getCommandSourceName } from "src/util";
import MobileModifyModal from "../ui/mobileModifyModal";
import ChangeableText from "./changeableText";

interface CommandProps {
	plugin: SlashCommanderPlugin;
	pair: CommandIconPair;
	handleRemove: () => void;
	handleUp: () => void;
	handleDown: () => void;
	handleNewIcon: () => void;
	handleRename: (name: string) => void;
	handleModeChange: (mode?: string) => void;
	sortable?: boolean;
}

export default function CommandComponent({
	plugin,
	pair,
	handleRemove,
	handleDown,
	handleUp,
	handleNewIcon,
	handleRename,
	handleModeChange,
	sortable = true,
}: CommandProps): h.JSX.Element {
	const cmd = getCommandFromId(plugin, pair.id);
	if (!cmd) {
		return (
			<Fragment>
				{Platform.isDesktop && (
					<div className="setting-item mod-toggle">
						<ObsidianIcon
							icon="alert-triangle"
							size={20}
							className="cmdr-icon clickable-icon mod-warning"
						/>
						<div className="setting-item-info">
							<div className="setting-item-name">{pair.name}</div>
							<div className="setting-item-description">
								{t(
									"This command is not available on this device."
								)}
							</div>
						</div>
						<div className="setting-item-control">
							<button
								className="mod-warning"
								style="display: flex"
								onClick={handleRemove}
								aria-label={t("Delete")}
							>
								<ObsidianIcon icon="lucide-trash" />
							</button>
						</div>
					</div>
				)}
				{Platform.isMobile && (
					<div
						className="mobile-option-setting-item"
						onClick={(): void => {
							new Notice(
								t(
									"This command is not available on this device."
								)
							);
						}}
					>
						<span
							className="mobile-option-setting-item-remove-icon"
							onClick={handleRemove}
						>
							<ObsidianIcon
								icon="minus-with-circle"
								size={22}
								style={{ color: "var(--text-error)" }}
							/>
						</span>
						<span className="mobile-option-setting-item-option-icon mod-warning">
							<ObsidianIcon icon={"alert-triangle"} size={22} />
						</span>
						<span className="mobile-option-setting-item-name">
							{pair.name}
						</span>
					</div>
				)}
			</Fragment>
		);
	}

	// const isChecked =
	// 	cmd.hasOwnProperty("checkCallback") ||
	// 	cmd.hasOwnProperty("editorCheckCallback");

	const modeIcon = getModeIcon(pair.mode);
	const modeName = pair.mode.match(/desktop|mobile|any/)
		? pair.mode[0].toUpperCase() + pair.mode.substring(1)
		: t("This device");

	return (
		<Fragment>
			{Platform.isDesktop && (
				<div className="setting-item mod-toggle">
					<ObsidianIcon
						icon={pair.icon}
						size={20}
						aria-label={t("Choose new")}
						onClick={handleNewIcon}
						className="cmdr-icon clickable-icon"
					/>
					<div className="setting-item-info">
						<div className="setting-item-name">
							<ChangeableText
								ariaLabel={t("Double click to rename")}
								handleChange={({ target }): void => {
									/* @ts-ignore */
									handleRename(target?.value);
								}}
								value={pair.name}
							/>
						</div>
						<div className="setting-item-description">
							{
								"From {{plugin_name}}".replace(
									"{{plugin_name}}",
									getCommandSourceName(plugin, cmd)
								)
							}
							{
								pair.name !== cmd.name ?
									` "${cmd.name}"` : "."
							}
							{/* {" "} */}
							{/* {isChecked
								? t(
									"Warning: This command might not run under every circumstance."
								)
								: ""} */}
						</div>
					</div>
					<div className="setting-item-control">
						{sortable && (
							<>
								<ObsidianIcon
									icon="arrow-down"
									className="setting-editor-extra-setting-button clickable-icon"
									onClick={handleDown}
									aria-label={t("Move down")}
								/>
								<ObsidianIcon
									icon="arrow-up"
									className="setting-editor-extra-setting-button clickable-icon"
									onClick={handleUp}
									aria-label={t("Move up")}
								/>
							</>
						)}
						<ObsidianIcon
							icon={modeIcon}
							className="setting-editor-extra-setting-button clickable-icon"
							onClick={(): void => handleModeChange()}
							aria-label={t(
								"Change mode (Currently: {{current_mode}})"
							).replace("{{current_mode}}", modeName)}
						/>
						<button
							className="mod-warning"
							style="display: flex"
							onClick={handleRemove}
							aria-label={t("Delete")}
						>
							<ObsidianIcon icon="lucide-trash" />
						</button>
					</div>
				</div>
			)}

			{Platform.isMobile && (
				<div className="mobile-option-setting-item">
					<span
						className="mobile-option-setting-item-remove-icon"
						onClick={handleRemove}
					>
						<ObsidianIcon
							icon="minus-with-circle"
							size={22}
							style={{ color: "var(--text-error)" }}
						/>
					</span>
					<span className="mobile-option-setting-item-option-icon">
						<ObsidianIcon
							icon={pair.icon}
							size={22}
							onClick={(): void => {
								new MobileModifyModal(
									plugin,
									pair,
									handleRename,
									handleNewIcon,
									handleModeChange
								).open();
							}}
						/>
					</span>
					<span
						className="mobile-option-setting-item-name"
						onClick={(): void => {
							new MobileModifyModal(
								plugin,
								pair,
								handleRename,
								handleNewIcon,
								handleModeChange
							).open();
						}}
					>
						{pair.name}
					</span>
					<span className="mobile-option-setting-item-option-icon">
						{sortable && (
							<>
								<ObsidianIcon
									icon="arrow-down"
									className="clickable-icon"
									onClick={handleDown}
								/>
								<ObsidianIcon
									icon="arrow-up"
									className="clickable-icon"
									onClick={handleUp}
								/>
							</>
						)}
						<ObsidianIcon
							icon="three-horizontal-bars"
							className="clickable-icon"
							onClick={(): void => {
								new MobileModifyModal(
									plugin,
									pair,
									handleRename,
									handleNewIcon,
									handleModeChange
								).open();
							}}
						/>
					</span>
				</div>
			)}
		</Fragment>
	);
}

function getModeIcon(mode: string): string {
	if (mode === "mobile") return "smartphone";
	if (mode === "desktop") return "monitor";
	if (mode === "any") return "cmdr-all-devices";
	return "airplay";
}