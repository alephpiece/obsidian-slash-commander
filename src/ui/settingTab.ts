import { Platform, PluginSettingTab } from "obsidian";
import { h, render } from "preact";
import SlashCommanderPlugin from "../main";
import settingTabComponent from "./components/settingTabComponent";

export default class CommanderSettingTab extends PluginSettingTab {
	private plugin: SlashCommanderPlugin;

	public constructor(plugin: SlashCommanderPlugin) {
		super(plugin.app, plugin);
		this.plugin = plugin;
	}

	public display(): void {
		render(
			h(settingTabComponent, {
				plugin: this.plugin,
				mobileMode: Platform.isMobile,
			}),
			this.containerEl
		);
	}

	public hide(): void {
		render(null, this.containerEl);
	}
}
