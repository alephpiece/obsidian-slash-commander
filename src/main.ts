import { MarkdownView, Plugin } from "obsidian";
import { DEFAULT_SETTINGS } from "./constants";
import t from "./l10n";
import { CommanderSettings, EnhancedEditor } from "./types";
import CommanderSettingTab from "./settings/settingTab";
import SettingTabModal from "./settings/settingTabModal";
import CommandManager from "./manager/commandManager";
import { SlashSuggester } from "./suggesters/slashSuggest";
import { MenuSuggest } from "./suggesters/menuSuggest";
import { buildQueryPattern } from "./utils/search";

import "./styles/styles.scss";
import registerCustomIcons from "./assets/icons";

export default class SlashCommanderPlugin extends Plugin {
	public settings: CommanderSettings;
	public manager: CommandManager;
	public scrollArea?: Element | undefined;
	public menuSuggest?: MenuSuggest;

	public async onload(): Promise<void> {
		await this.loadSettings();

		registerCustomIcons();

		this.manager = new CommandManager(this);

		this.addSettingTab(new CommanderSettingTab(this));

		this.addCommand({
			name: t("Open settings"),
			id: "open-settings",
			callback: () => new SettingTabModal(this).open(),
		});

		this.addCommand({
			name: t("Open standalone menu"),
			id: "open-standalone-menu",
			editorCallback: (editor: EnhancedEditor) => {
				this.menuSuggest?.close();
				this.menuSuggest = new MenuSuggest(this, editor, this.scrollArea);
				this.menuSuggest.open();
			},
		});

		this.registerEditorSuggest(new SlashSuggester(this));

		this.registerDomEvent(document, "click", () => {
			this.menuSuggest?.close();
		});

		// Get the scroller area
		// Credits go to https://github.com/Jambo2018/notion-assistant-plugin
		const renderPlugin = (): void => {
			const view = this.app.workspace.getActiveViewOfType(MarkdownView);
			if (!view) return;
			this.scrollArea =
				view.containerEl.querySelector(".cm-scroller") ?? undefined;
			if (!this.scrollArea) return;
		};

		/**Ensure that the plugin can be loaded and used immediately after it is turned on */
		renderPlugin();

		this.registerEvent(
			this.app.workspace.on("active-leaf-change", renderPlugin)
		);
	}

	public onunload(): void {
		document.head.querySelector("style#cmdr")?.remove();
		this.menuSuggest?.close();
	}

	private async loadSettings(): Promise<void> {
		const data = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
		this.settings = data;
		this.settings.queryPattern = buildQueryPattern(this.settings);
	}

	public async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}
}
