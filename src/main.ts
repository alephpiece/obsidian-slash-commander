import { MarkdownView, Plugin } from "obsidian";
import { EnhancedEditor } from "./data/models/Settings";
import CommanderSettingTab from "@/ui/settingTab";
import SettingTabModal from "@/ui/modals/settingTabModal";
import { SlashSuggester } from "@/services/suggesters/slashSuggest";
import { MenuSuggest } from "@/services/suggesters/menuSuggest";

import "@/ui/styles/styles.scss";
import registerCustomIcons from "@/assets/icons";
import i18n from "@/i18n"; // initialize i18n
import { useSettingStore } from "@/data/stores/useSettingStore";

export default class SlashCommanderPlugin extends Plugin {
	public scrollArea?: Element | undefined;
	public menuSuggest?: MenuSuggest;
	private storeUnsubscribe?: () => void;

	public get settings() {
		return useSettingStore.getState().settings;
	}

	public async onload(): Promise<void> {
		// Initialize the Zustand state store
		useSettingStore.getState().setPlugin(this);
		await useSettingStore.getState().initialize();

		registerCustomIcons();

		// Register settings tab
		this.addSettingTab(new CommanderSettingTab(this));

		// Initialize plugin UI and commands
		this.initializePlugin();
	}

	private initializePlugin(): void {
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

		// Clean up Zustand store subscription
		if (this.storeUnsubscribe) {
			this.storeUnsubscribe();
		}
	}

	public async saveSettings(): Promise<void> {
		await useSettingStore.getState().saveSettings();
	}
}
