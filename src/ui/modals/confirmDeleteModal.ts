import { Modal } from "obsidian";
import { h, render, VNode } from "preact";
import i18n from "@/i18n";
import SlashCommanderPlugin from "@/main";
import { confirmDeleteComponent } from "@/ui/components/confirmDeleteComponent";

export default class ConfirmDeleteModal extends Modal {
	private reactComponent: VNode;
	public remove: boolean;

	// eslint-disable-next-line no-unused-vars
	public constructor(public plugin: SlashCommanderPlugin) {
		super(plugin.app);
	}

	public async onOpen(): Promise<void> {
		this.titleEl.innerText = i18n.t("modal.remove_command.title");
		this.containerEl.style.zIndex = "99";
		this.reactComponent = h(confirmDeleteComponent, { modal: this });
		render(this.reactComponent, this.contentEl);
	}

	public async didChooseRemove(): Promise<boolean> {
		this.open();
		return new Promise(resolve => {
			this.onClose = (): void => resolve(this.remove ?? false);
		});
	}

	public onClose(): void {
		render(null, this.contentEl);
	}
}
