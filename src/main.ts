import "@/ui/styles/styles.scss";

import { MarkdownView, Notice, Plugin } from "obsidian";

import registerCustomIcons from "@/assets/icons";
import { EnhancedEditor } from "@/data/models/Settings";
import { useSettingStore } from "@/data/stores/useSettingStore";
import i18n from "@/i18n"; // initialize i18n
import { MenuSuggest } from "@/services/suggest/menuSuggest";
import { SlashSuggester } from "@/services/suggest/slashSuggest";
import SettingTabModal from "@/ui/modals/SettingTabModal";
import CommanderSettingTab from "@/ui/settingTab";

export default class SlashCommanderPlugin extends Plugin {
    public scrollArea?: Element | undefined;
    public menuSuggest?: MenuSuggest;
    private storeUnsubscribe?: () => void;

    public get settings() {
        return useSettingStore.getState().settings;
    }

    public async onload(): Promise<void> {
        try {
            // Initialize the Zustand state store
            useSettingStore.getState().setPlugin(this);
            await useSettingStore.getState().initialize();

            registerCustomIcons();

            // Register settings tab
            this.addSettingTab(new CommanderSettingTab(this));

            // Initialize plugin UI and commands
            this.initializePlugin();
        } catch (error) {
            new Notice(`SlashCommander: ${error}`);
        }
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
        try {
            document.head.querySelector("style#cmdr")?.remove();
            this.menuSuggest?.close();

            // Clean up Zustand store subscription
            this.storeUnsubscribe?.();
        } catch (error) {
            new Notice(`SlashCommander: ${error}`);
        }
    }
}
