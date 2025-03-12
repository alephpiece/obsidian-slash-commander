import type { ReactElement, ChangeEvent } from "react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import ObsidianIcon from "src/ui/components/obsidianIconComponent";
import MobileModifyModal from "../modals/mobileModifyModal";

interface MobileModifyProps {
	modal: MobileModifyModal;
}

export default function MobileModifyComponent({
	modal: controller,
}: MobileModifyProps): ReactElement {
	const { t } = useTranslation();

	useEffect(() => {
		const update = (): void => {
			// Force a re-render when icon changes
			window.dispatchEvent(new Event("cmdr-icon-changed"));
		};
		window.addEventListener("cmdr-icon-changed", update);
		return () => window.removeEventListener("cmdr-icon-changed", update);
	}, []);

	const handleNameChange = (e: ChangeEvent<HTMLInputElement>): void => {
		controller.handleRename(e.currentTarget.value);
	};

	const handleDeviceModeChange = (e: ChangeEvent<HTMLSelectElement>): void => {
		controller.handleDeviceModeChange(e.currentTarget.value);
	};

	const handleTriggerModeChange = (e: ChangeEvent<HTMLSelectElement>): void => {
		controller.handleTriggerModeChange(e.currentTarget.value);
	};

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
					onBlur={handleNameChange}
					type="text"
					placeholder={t("modals.new_name.placeholder")}
					value={controller.pair.name}
				/>
			</div>
			<div className="cmdr-mobile-modify-option">
				<select
					className="dropdown"
					value={controller.pair.mode}
					onChange={handleDeviceModeChange}
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
					onChange={handleTriggerModeChange}
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
