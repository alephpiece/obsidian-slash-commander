import { MarkdownView, Plugin } from "obsidian";
import { CommanderSettings, EnhancedEditor } from "@/data/models/Settings";
import CommanderSettingTab from "@/ui/settingTab";
import SettingTabModal from "@/ui/modals/settingTabModal";
import { SlashSuggester } from "@/services/suggesters/slashSuggest";
import { MenuSuggest } from "@/services/suggesters/menuSuggest";

import "@/ui/styles/styles.scss";
import registerCustomIcons from "@/assets/icons";
import CommandStore from "@/data/stores/CommandStore";
import SettingsStore from "@/data/stores/SettingsStore";
import i18n from "@/i18n"; // initialize i18n

export default class SlashCommanderPlugin extends Plugin {
	public settings: CommanderSettings;
	public commandStore: CommandStore;
	public settingsStore: SettingsStore;
	public scrollArea?: Element | undefined;
	public menuSuggest?: MenuSuggest;

	public async onload(): Promise<void> {
		this.settingsStore = new SettingsStore(this);
		this.settings = await this.settingsStore.loadSettings();

		registerCustomIcons();

		this.addSettingTab(new CommanderSettingTab(this));

		// Ensure that active views are detected
		this.app.workspace.onLayoutReady(() => {
			// Initialize plugin when it's already enabled on startup
			if (this.manifest.id in this.app.plugins.manifests) {
				this.initializePlugin();
			}
		});
	}

	public onUserEnable(): void {
		this.initializePlugin();
	}

	private initializePlugin(): void {
		this.commandStore = new CommandStore(this);

		this.addCommand({
			name: i18n.t("settings.open"),
			id: "open-settings",
			callback: () => new SettingTabModal(this).open(),
		});

		this.addCommand({
			name: i18n.t("standalone.menu.open"),
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
		const renderPlugin = (): void => {
			const view = this.app.workspace.getActiveViewOfType(MarkdownView);
			if (!view) return;
			this.scrollArea = view.containerEl.querySelector(".cm-scroller") ?? undefined;
			if (!this.scrollArea) return;
		};

		this.app.workspace.onLayoutReady(renderPlugin);
		this.registerEvent(this.app.workspace.on("active-leaf-change", renderPlugin));
	}

	public onunload(): void {
		document.head.querySelector("style#cmdr")?.remove();
		this.menuSuggest?.close();
	}

	public async saveSettings(): Promise<void> {
		await this.settingsStore.saveSettings();
	}
}
