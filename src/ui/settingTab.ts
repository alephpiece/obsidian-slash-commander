import { Platform, PluginSettingTab } from "obsidian";
import { createElement } from "react";
import { createRoot } from "react-dom/client";
import SlashCommanderPlugin from "@/main";
import settingTabComponent from "@/ui/components/settingTabComponent";

export default class CommanderSettingTab extends PluginSettingTab {
    private plugin: SlashCommanderPlugin;
    private root: ReturnType<typeof createRoot> | null = null;

    public constructor(plugin: SlashCommanderPlugin) {
        super(plugin.app, plugin);
        this.plugin = plugin;
    }

    public display(): void {
        if (!this.root) {
            this.root = createRoot(this.containerEl);
        }
        this.root.render(
            createElement(settingTabComponent, {
                plugin: this.plugin,
                mobileMode: Platform.isMobile,
            })
        );
    }

    public hide(): void {
        this.root?.unmount();
        this.root = null;
    }
}
