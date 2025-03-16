import type { ReactElement } from "react";
import { useState, useEffect } from "react";
import { isTriggerInConflicts } from "@/services/utils/util";
import ObsidianIcon from "@ui/components/obsidianIconComponent";
import SlashCommanderPlugin from "@/main";
import { ToggleComponent, TextBoxComponent } from "@ui/components/settingItemComponent";
import { SettingCollapser, SettingCollapserWithTools } from "@/ui/components/SettingHeaders";
import TriggerViewer from "@ui/components/TriggerViewerComponent";
import { useTranslation } from "react-i18next";
import { CommanderSettings } from "@/data/models/Settings";
import { CommandViewerToolsBar } from "@/ui/viewer/CommandViewerTools";
import { CommandViewer } from "@/ui/viewer";

interface SettingTabProps {
	plugin: SlashCommanderPlugin;
	mobileMode: boolean;
}

export default function SettingTabComponent({ plugin }: SettingTabProps): ReactElement {
	const { t } = useTranslation();
	const [settings, setSettings] = useState<CommanderSettings>(plugin.settingsStore.getSettings());

	useEffect(() => {
		const unsubscribe = plugin.settingsStore.subscribe(newSettings => {
			setSettings({ ...newSettings });
		});

		return unsubscribe;
	}, [plugin]);

	return (
		<div>
			<div>
				<h2>{t("settings.general")}</h2>
				{isTriggerInConflicts(plugin) && (
					<div
						className="setting-item"
						style={{ border: "thin solid crimson", paddingLeft: "1em" }}
					>
						<ObsidianIcon
							icon="alert-triangle"
							size="var(--icon-xl)"
							className="cmdr-icon mod-warning"
							style={{
								display: "flex",
								alignSelf: "start",
								justifyContent: "center",
							}}
						/>
						<div className="setting-item-info">
							<div
								className="setting-item-name"
								style={{ fontWeight: "bold", color: "crimson" }}
							>
								{t("triggers.conflict.title")}
							</div>
							<div className="setting-item-description">
								{t("triggers.conflict.detail")}
							</div>
						</div>
					</div>
				)}
				<TextBoxComponent
					value={settings.mainTrigger}
					name={t("triggers.command.title")}
					description={t("triggers.command.detail")}
					changeHandler={async (value): Promise<void> => {
						plugin.settingsStore.updateSettings({
							mainTrigger: value,
						});
					}}
				/>
				<ToggleComponent
					name={t("triggers.more.title")}
					description={t("triggers.more.detail")}
					value={settings.useExtraTriggers}
					changeHandler={async (value): Promise<void> => {
						plugin.settingsStore.updateSettings({
							useExtraTriggers: !value,
						});
					}}
				/>
				{settings.useExtraTriggers && <TriggerViewer plugin={plugin} />}
				<ToggleComponent
					name={t("settings.newline_only")}
					description={t("settings.newline_only.detail")}
					value={settings.triggerOnlyOnNewLine}
					changeHandler={async (value): Promise<void> => {
						plugin.settingsStore.updateSettings({
							triggerOnlyOnNewLine: !value,
						});
					}}
				/>
				<ToggleComponent
					name={t("settings.show_descriptions")}
					description={t("settings.show_descriptions.detail")}
					value={settings.showDescriptions}
					changeHandler={async (value): Promise<void> => {
						plugin.settingsStore.updateSettings({
							showDescriptions: !value,
						});
					}}
				/>
				<ToggleComponent
					name={t("settings.show_sources")}
					description={t("settings.show_sources.detail")}
					value={settings.showSourcesForDuplicates}
					changeHandler={async (value): Promise<void> => {
						plugin.settingsStore.updateSettings({
							showSourcesForDuplicates: !value,
						});
					}}
				/>
				<ToggleComponent
					name={t("settings.ask_before_removing")}
					description={t("settings.ask_before_removing.detail")}
					value={settings.confirmDeletion}
					changeHandler={async (value): Promise<void> => {
						plugin.settingsStore.updateSettings({
							confirmDeletion: !value,
						});
					}}
				/>
			</div>
			<SettingCollapserWithTools
				title={t("bindings.title")}
				tools={<CommandViewerToolsBar />}
			>
				<CommandViewer
					plugin={plugin}
					collapsible={true}
					indentationWidth={20}
					removable={true}
				/>
			</SettingCollapserWithTools>
		</div>
	);
}
