import { h } from "preact";
import { useEffect } from "preact/hooks";
import { useTranslation } from "react-i18next";
import ObsidianIcon from "src/ui/components/obsidianIconComponent";
import MobileModifyModal from "../modals/mobileModifyModal";

export default function MobileModifyComponent({
	modal: controller,
}: {
	modal: MobileModifyModal;
}): h.JSX.Element {
	const { t } = useTranslation();
	useEffect(() => {
		const update = (): void => {
			this.forceUpdate();
		};
		addEventListener("cmdr-icon-changed", update);
		return () => removeEventListener("cmdr-icon-changed", update);
	}, []);

	return (
		<div className="cmdr-mobile-modify-grid">
			<div className="cmdr-mobile-modify-option" onClick={controller.handleNewIcon}>
				<span>{t("common.icon")}</span>
				<span className="cmdr-flex cmdr-gap-1">
					<ObsidianIcon
						icon={controller.pair.icon}
						size="var(--icon-m)"
						className="clickable-icon"
						style={{ marginRight: "0px" }}
					/>
				</span>
			</div>
			<div className="cmdr-mobile-modify-option">
				<span>{t("common.name")}</span>
				<input
					onBlur={({ currentTarget }): void =>
						controller.handleRename(currentTarget.value)
					}
					type="text"
					placeholder={t("modals.new_name.placeholder")}
					value={controller.pair.name}
				/>
			</div>
			<div className="cmdr-mobile-modify-option">
				<select
					className="dropdown"
					value={controller.pair.mode}
					onChange={({ currentTarget }): void =>
						controller.handleDeviceModeChange(currentTarget.value)
					}
				>
					<option value="any">{t("bindings.device_mode.any.detail")}</option>
					<option value="mobile">{t("bindings.device_mode.mobile.detail")}</option>
					<option value="desktop">{t("bindings.device_mode.desktop.detail")}</option>
					<option value={controller.plugin.app.appId}>
						{t("bindings.device_mode.this.detail")}
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
					<option value="anywhere">{t("bindings.trigger_mode.anywhere.detail")}</option>
					<option value="newline">{t("bindings.trigger_mode.newline.detail")}</option>
					<option value="inline">{t("bindings.trigger_mode.inline.detail")}</option>
				</select>
			</div>
			<div className="modal-button-container">
				<button className="mod-cta" onClick={(): void => controller.close()}>
					{t("common.done")}
				</button>
			</div>
		</div>
	);
}
