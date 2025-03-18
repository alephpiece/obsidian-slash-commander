import { MarkdownView, Plugin } from "obsidian";
import { CommanderSettings, EnhancedEditor } from "./data/models/Settings";
import CommanderSettingTab from "@/ui/settingTab";
import SettingTabModal from "@/ui/modals/settingTabModal";
import { SlashSuggester } from "@/services/suggesters/slashSuggest";
import { MenuSuggest } from "@/services/suggesters/menuSuggest";

import "@/ui/styles/styles.scss";
import registerCustomIcons from "@/assets/icons";
import i18n from "@/i18n"; // initialize i18n
import { useCommands, useSettings, useUpdateSettings, useValidCommands } from "@/data/hooks";
import { useSettingStore } from "@/data/stores/useSettingStore";
import { SlashCommand } from "./data/models/SlashCommand";
import * as CommandService from "@/services/command";

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

		// Register state listener for settings changes
		this.storeUnsubscribe = useSettingStore.subscribe(
			state => state.settings,
			(newSettings) => {
				// Register active commands
				CommandService.registerCommands(this, newSettings.bindings);
			}
		);
	}

	public onUserEnable(): void {
		// User enabled the plugin, trigger re-registration of commands
		CommandService.registerCommands(this, useSettingStore.getState().getCommands());
	}

	private initializePlugin(): void {
		this.registerEditorSuggest(new SlashSuggester(this));

		this.addCommand({
			id: "open-settings-menu",
			name: i18n.t("commands.openSettingsMenu"),
			callback: () => new SettingTabModal(this).open(),
		});

		this.addCommand({
			id: "activate-current-item",
			name: i18n.t("commands.activateCurrentItem"),
			checkCallback: (checking) => {
				if (!checking) {
					const view = this.app.workspace.getActiveViewOfType(MarkdownView);
					if (view?.editor) {
						// 实际执行命令逻辑
						return true;
					}
				}
				return !!this.app.workspace.getActiveViewOfType(MarkdownView);
			},
		});

		// 右键菜单建议
		this.menuSuggest = new MenuSuggest(this, null, this.scrollArea);
		this.registerEvent(this.app.workspace.on("layout-change", () => {
			// 更新 scrollArea
			const view = this.app.workspace.getActiveViewOfType(MarkdownView);
			if (view) {
				this.scrollArea = view.containerEl.querySelector(".cm-scroller") || undefined;
			}
		}));

		// Register commands with Obsidian
		CommandService.registerCommands(this, useSettingStore.getState().getCommands());
	}

	public onunload(): void {
		// Clean up Zustand store subscription
		if (this.storeUnsubscribe) {
			this.storeUnsubscribe();
		}
	}

	public async saveSettings(): Promise<void> {
		await useSettingStore.getState().saveSettings();
	}
}
