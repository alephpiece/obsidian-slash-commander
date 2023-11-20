import { Plugin } from "obsidian";
import { DEFAULT_SETTINGS } from "./constants";
import t from "./l10n";
import { CommanderSettings } from "./types";
import CommanderSettingTab from "./ui/settingTab";
import SettingTabModal from "./ui/settingTabModal";
import CommandManager from "./manager/commandManager";
import { SlashSuggester } from "./suggest";
import { buildQueryPattern } from "./util";

import "./styles/styles.scss";
import registerCustomIcons from "./ui/icons";

export default class SlashCommanderPlugin extends Plugin {
	public settings: CommanderSettings;
	public manager: CommandManager;

	public async onload(): Promise<void> {
		await this.loadSettings();

		registerCustomIcons();

		this.manager = new CommandManager(this);

		this.addSettingTab(new CommanderSettingTab(this));

		this.addCommand({
			name: t("Open Commander Settings"),
			id: "open-commander-settings",
			callback: () => new SettingTabModal(this).open(),
		});

		this.registerEditorSuggest(new SlashSuggester(this));
	}

	public onunload(): void {
		document.head.querySelector("style#cmdr")?.remove();
	}

	private async loadSettings(): Promise<void> {
		const data = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
		this.settings = data;
		this.settings.queryPattern = buildQueryPattern(this.settings.trigger);
	}

	public async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}
}
