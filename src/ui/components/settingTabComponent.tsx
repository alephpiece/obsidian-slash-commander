import { Fragment, h } from "preact";
import t from "src/l10n";
import { ObsidianIcon, buildQueryPattern, isTriggerInConflicts } from "src/util";
import SlashCommanderPlugin from "../../main";
import CommandViewer from "./commandViewerComponent";
import {
	ToggleComponent,
	TextBoxComponent
} from "./settingItemComponent";
import SettingCollapser from "./settingHeaderComponent";

export default function settingTabComponent({
	plugin,
}: {
	plugin: SlashCommanderPlugin;
	mobileMode: boolean;
}): h.JSX.Element {

	return (
		<Fragment>
			<Fragment>
				<h2>{t("General")}</h2>
				{isTriggerInConflicts(plugin) && (
					<div
						className="setting-item"
						style="border: thin solid crimson; padding-left: 1em"
					>
						<ObsidianIcon
							icon="alert-triangle"
							size={20}
							className="cmdr-suggest-item-icon-large mod-warning"
						/>
						<div className="setting-item-info">
							<div
								className="setting-item-name"
								style="font-weight: bold; color: crimson"
							>
								{t("Command trigger conflicts with the 'Slash commands' plugin.")}
							</div>
							<div className="setting-item-description">
								{t("Please pick another trigger or disable the above plugin, and then reload this setting tab to dismiss this warning.")}
							</div>
						</div>
					</div>
				)}
				<TextBoxComponent
					value={plugin.settings.trigger}
					name={t("Command trigger")}
					description={t("Characters to trigger slash commands.")}
					changeHandler={async (value): Promise<void> => {
						plugin.settings.trigger = value;
						plugin.settings.queryPattern = buildQueryPattern(value);
						await plugin.saveSettings();
					}}
				/>
				<ToggleComponent
					name={t("Ask before removing")}
					description={t(
						"Always show a popup to confirm deletion of a command."
					)}
					value={plugin.settings.confirmDeletion}
					changeHandler={async (value): Promise<void> => {
						plugin.settings.confirmDeletion = !value;
						await plugin.saveSettings();
					}}
				/>
				<ToggleComponent
					name={t("Show command descriptions")}
					description={t(
						"Always show command descriptions in editor suggestions."
					)}
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
			</Fragment>
			<SettingCollapser title={t("Bindings")}>
				<CommandViewer
					manager={plugin.manager}
					plugin={plugin}
					sortable={true}
				/>
			</SettingCollapser>
		</Fragment>
	);
}
