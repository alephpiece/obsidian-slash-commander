import { Modal, Platform } from "obsidian";
import { createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import SlashCommanderPlugin from "@/main";
import settingTabComponent from "@/ui/components/settingTabComponent";

export default class SettingTabModal extends Modal {
	private plugin: SlashCommanderPlugin;
	private root: Root | null = null;

	public constructor(plugin: SlashCommanderPlugin) {
		super(plugin.app);
		this.plugin = plugin;
		this.containerEl.addClass("cmdr-setting-modal");
	}

	public onOpen(): void {
		const mobileMode = Platform.isMobile;
		this.root = createRoot(this.contentEl);
		this.root.render(createElement(settingTabComponent, { plugin: this.plugin, mobileMode }));
	}

	public onClose(): void {
		if (this.root) {
			this.root.unmount();
			this.root = null;
		}
	}
}
