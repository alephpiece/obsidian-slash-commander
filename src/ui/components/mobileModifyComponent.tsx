import { h } from "preact";
import { useEffect } from "preact/hooks";
import t from "src/l10n";
import ObsidianIcon from "src/ui/components/obsidianIconComponent";
import MobileModifyModal from "../modals/mobileModifyModal";

export default function MobileModifyComponent({
	modal: controller,
}: {
	modal: MobileModifyModal;
}): h.JSX.Element {
	useEffect(() => {
		const update = (): void => {
			this.forceUpdate();
		};
		addEventListener("cmdr-icon-changed", update);
		return () => removeEventListener("cmdr-icon-changed", update);
	}, []);

	return (
		<div className="cmdr-mobile-modify-grid">
			<div
				className="cmdr-mobile-modify-option"
				onClick={controller.handleNewIcon}
			>
				<span>{t("Icon")}</span>
				<span className="cmdr-flex cmdr-gap-1">
					<ObsidianIcon
						icon={controller.pair.icon}
						size={20}
						className="clickable-icon"
						style={{ marginRight: "0px" }}
					/>
				</span>
			</div>
			<div className="cmdr-mobile-modify-option">
				<span>{t("Name")}</span>
				<input
					onBlur={({ currentTarget }): void =>
						controller.handleRename(currentTarget.value)
					}
					type="text"
					placeholder={t("Custom name")}
					value={controller.pair.name}
				/>
			</div>
			<div className="cmdr-mobile-modify-option">
				<select
					className="dropdown"
					value={controller.pair.mode}
					onChange={({ currentTarget }): void =>
						controller.handleModeChange(currentTarget.value)
					}
				>
					<option value="any">
						{t("Add command to all devices")}
					</option>
					<option value="mobile">
						{t("Add command only to mobile devices")}
					</option>
					<option value="desktop">
						{t("Add command only to desktop devices")}
					</option>
					<option value={controller.plugin.app.appId}>
						{t("Add command only to this device")}
					</option>
				</select>
			</div>
			<div className="cmdr-mobile-modify-option">
				<select
					className="dropdown"
					value={controller.pair.triggerMode}
					onChange={({ currentTarget }): void =>
						controller.handleTriggerModeChange(currentTarget.value)
					}
				>
					<option value="anywhere">
						{t("Show command on any triggering")}
					</option>
					<option value="newline">
						{t("Show command on newline triggering")}
					</option>
					<option value="inline">
						{t("Show command on inline triggering")}
					</option>
				</select>
			</div>
			<div className="modal-button-container">
				<button
					className="mod-cta"
					onClick={(): void => controller.close()}
				>
					{t("Done")}
				</button>
			</div>
		</div>
	);
}
