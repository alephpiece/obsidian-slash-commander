import { Fragment, h } from "preact";
import { isTriggerInConflicts } from "@/services/utils/util";
import ObsidianIcon from "src/ui/components/obsidianIconComponent";
import { buildQueryPattern } from "@/services/utils/search";
import SlashCommanderPlugin from "../../main";
import CommandViewer from "./commandViewerComponent";
import { ToggleComponent, TextBoxComponent } from "./settingItemComponent";
import SettingCollapser from "./settingHeaderComponent";
import TriggerViewer from "./TriggerViewerComponent";
import { useTranslation } from "react-i18next";

export default function settingTabComponent({
	plugin,
}: {
	plugin: SlashCommanderPlugin;
	mobileMode: boolean;
}): h.JSX.Element {
	const { t } = useTranslation();
	return (
		<>
			<>
				<h2>{t("settings.general")}</h2>
				{isTriggerInConflicts(plugin) && (
					<div
						className="setting-item"
						style="border: thin solid crimson; padding-left: 1em"
					>
						<ObsidianIcon
							icon="alert-triangle"
							size="var(--icon-m)"
							className="cmdr-suggest-item-icon-large mod-warning"
						/>
						<div className="setting-item-info">
							<div
								className="setting-item-name"
								style="font-weight: bold; color: crimson"
							>
								{t(
									"triggers.conflict.title"
								)}
							</div>
							<div className="setting-item-description">
								{t(
									"triggers.conflict.detail"
								)}
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
						this.forceUpdate();
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
			</>
			<SettingCollapser title={t("bindings.title")}>
				<CommandViewer manager={plugin.commandStore} plugin={plugin} />
			</SettingCollapser>
		</>
	);
}
