import type { ReactElement } from "react";
import { isTriggerInConflicts } from "@/services/utils/util";
import ObsidianIcon from "@ui/components/obsidianIconComponent";
import { buildQueryPattern } from "@/services/utils/search";
import SlashCommanderPlugin from "@/main";
import CommandViewer from "@ui/components/commandViewerComponent";
import { ToggleComponent, TextBoxComponent } from "@ui/components/settingItemComponent";
import SettingCollapser from "@ui/components/settingHeaderComponent";
import TriggerViewer from "@ui/components/TriggerViewerComponent";
import { useTranslation } from "react-i18next";

interface SettingTabProps {
	plugin: SlashCommanderPlugin;
	mobileMode: boolean;
}

export default function SettingTabComponent({ plugin }: SettingTabProps): ReactElement {
	const { t } = useTranslation();

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
							size="var(--icon-m)"
							className="cmdr-suggest-item-icon-large mod-warning"
							style={{ display: "flex" }}
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
					value={plugin.settings.mainTrigger}
					name={t("triggers.command.title")}
					description={t("triggers.command.detail")}
					changeHandler={async (value): Promise<void> => {
						plugin.settings.mainTrigger = value;
						plugin.settings.queryPattern = buildQueryPattern(plugin.settings);
						await plugin.saveSettings();
					}}
				/>
				<ToggleComponent
					name={t("triggers.more.title")}
					description={t("triggers.more.detail")}
					value={plugin.settings.useExtraTriggers}
					changeHandler={async (value): Promise<void> => {
						plugin.settings.useExtraTriggers = !value;
						plugin.settings.queryPattern = buildQueryPattern(plugin.settings);
						await plugin.saveSettings();
					}}
				/>
				{plugin.settings.useExtraTriggers && <TriggerViewer plugin={plugin} />}
				<ToggleComponent
					name={t("settings.newline_only")}
					description={t("settings.newline_only.detail")}
					value={plugin.settings.triggerOnlyOnNewLine}
					changeHandler={async (value): Promise<void> => {
						plugin.settings.triggerOnlyOnNewLine = !value;
						await plugin.saveSettings();
					}}
				/>
				<ToggleComponent
					name={t("settings.show_descriptions")}
					description={t("settings.show_descriptions.detail")}
					value={plugin.settings.showDescriptions}
					changeHandler={async (value): Promise<void> => {
						plugin.settings.showDescriptions = !value;
						await plugin.saveSettings();
					}}
				/>
				<ToggleComponent
					name={t("settings.show_sources")}
					description={t("settings.show_sources.detail")}
					value={plugin.settings.showSourcesForDuplicates}
					changeHandler={async (value): Promise<void> => {
						plugin.settings.showSourcesForDuplicates = !value;
						await plugin.saveSettings();
					}}
				/>
				<ToggleComponent
					name={t("settings.ask_before_removing")}
					description={t("settings.ask_before_removing.detail")}
					value={plugin.settings.confirmDeletion}
					changeHandler={async (value): Promise<void> => {
						plugin.settings.confirmDeletion = !value;
						await plugin.saveSettings();
					}}
				/>
			</div>
			<SettingCollapser title={t("bindings.title")}>
				<CommandViewer manager={plugin.commandStore} plugin={plugin} />
			</SettingCollapser>
		</div>
	);
}
