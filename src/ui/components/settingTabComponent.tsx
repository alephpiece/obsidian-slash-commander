import { Fragment, h } from "preact";
import t from "@/i18n";
import { isTriggerInConflicts } from "@/services/utils/util";
import ObsidianIcon from "src/ui/components/obsidianIconComponent";
import { buildQueryPattern } from "@/services/utils/search";
import SlashCommanderPlugin from "../../main";
import CommandViewer from "./commandViewerComponent";
import { ToggleComponent, TextBoxComponent } from "./settingItemComponent";
import SettingCollapser from "./settingHeaderComponent";
import TriggerViewer from "./TriggerViewerComponent";

export default function settingTabComponent({
	plugin,
}: {
	plugin: SlashCommanderPlugin;
	mobileMode: boolean;
}): h.JSX.Element {
	return (
		<>
			<>
				<h2>{t("General")}</h2>
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
									"One of the command triggers conflicts with the 'Slash commands' plugin."
								)}
							</div>
							<div className="setting-item-description">
								{t(
									"Please modify your triggers or disable the above plugin, and then reload this setting tab to dismiss this warning."
								)}
							</div>
						</div>
					</div>
				)}
				<TextBoxComponent
					value={plugin.settings.mainTrigger}
					name={t("Command trigger")}
					description={t("Characters to trigger slash commands.")}
					changeHandler={async (value): Promise<void> => {
						plugin.settings.mainTrigger = value;
						plugin.settings.queryPattern = buildQueryPattern(plugin.settings);
						await plugin.saveSettings();
					}}
				/>
				<ToggleComponent
					name={t("More triggers")}
					description={t("Add more command triggers.")}
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
					name={t("Only on newline")}
					description={t(
						"Show commands only for triggers starting newlines. Turn this off to enable per-command settings."
					)}
					value={plugin.settings.triggerOnlyOnNewLine}
					changeHandler={async (value): Promise<void> => {
						plugin.settings.triggerOnlyOnNewLine = !value;
						await plugin.saveSettings();
					}}
				/>
				<ToggleComponent
					name={t("Show command descriptions")}
					description={t("Always show command descriptions in editor suggestions.")}
					value={plugin.settings.showDescriptions}
					changeHandler={async (value): Promise<void> => {
						plugin.settings.showDescriptions = !value;
						await plugin.saveSettings();
					}}
				/>
				<ToggleComponent
					name={t("Show command sources")}
					description={t(
						"Show command sources in editor suggestions for duplicated command names."
					)}
					value={plugin.settings.showSourcesForDuplicates}
					changeHandler={async (value): Promise<void> => {
						plugin.settings.showSourcesForDuplicates = !value;
						await plugin.saveSettings();
					}}
				/>
				<ToggleComponent
					name={t("Ask before removing")}
					description={t("Always show a popup to confirm deletion of a command.")}
					value={plugin.settings.confirmDeletion}
					changeHandler={async (value): Promise<void> => {
						plugin.settings.confirmDeletion = !value;
						await plugin.saveSettings();
					}}
				/>
			</>
			<SettingCollapser title={t("Bindings")}>
				<CommandViewer manager={plugin.commandStore} plugin={plugin} />
			</SettingCollapser>
		</>
	);
}
