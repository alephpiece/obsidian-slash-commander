/* eslint-disable no-unused-vars */
import { SlashCommand } from "@/data/models/SlashCommand";
import { Modal } from "obsidian";
import { createElement, type ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import MobileModifyComponent from "@/ui/components/mobileModifyComponent";
import SlashCommanderPlugin from "@/main";

export default class MobileModifyModal extends Modal {
	private root: Root | null = null;
	public remove: boolean;

	public constructor(
		public plugin: SlashCommanderPlugin,
		public pair: SlashCommand,
		public handleRename: (name: string) => void,
		public handleNewIcon: () => void,
		public handleDeviceModeChange: (mode?: string) => void,
		public handleTriggerModeChange: (mode?: string) => void
	) {
		super(plugin.app);
	}

	public async onOpen(): Promise<void> {
		this.titleEl.innerText = this.pair.name;
		this.root = createRoot(this.contentEl);
		this.root.render(createElement(MobileModifyComponent, { modal: this }));
	}

	public onClose(): void {
		if (this.root) {
			this.root.unmount();
			this.root = null;
		}
	}
}
