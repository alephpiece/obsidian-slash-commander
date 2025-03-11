/* eslint-disable no-unused-vars */
import { SlashCommand } from "@/data/models/SlashCommand";
import { Modal } from "obsidian";
import { h, render, VNode } from "preact";
import MobileModifyComponent from "../components/mobileModifyComponent";
import SlashCommanderPlugin from "src/main";

export default class MobileModifyModal extends Modal {
	private reactComponent: VNode;
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
		this.reactComponent = h(MobileModifyComponent, { modal: this });
		render(this.reactComponent, this.contentEl);
	}

	public onClose(): void {
		render(null, this.contentEl);
	}
}
