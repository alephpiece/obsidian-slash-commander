import { Modal } from "obsidian";
import { createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { t } from "i18next";
import SlashCommanderPlugin from "@/main";
import { confirmDeleteComponent } from "@/ui/components/confirmDeleteComponent";
import { SlashCommand } from "@/data/models/SlashCommand";

export default class ConfirmDeleteModal extends Modal {
	private root: Root | null = null;
	public remove: boolean;
	private command: SlashCommand | undefined;
	private onSyncCallback: (() => void) | undefined;

	public constructor(
		public plugin: SlashCommanderPlugin,
		command?: SlashCommand,
		onSync?: () => void
	) {
		super(plugin.app);
		this.command = command;
		this.onSyncCallback = onSync;
	}

	public async onOpen(): Promise<void> {
		this.titleEl.innerText = t("modal.remove_command.title");
		this.containerEl.style.zIndex = "99";
		this.root = createRoot(this.contentEl);
		this.root.render(createElement(confirmDeleteComponent, { 
			modal: this,
			command: this.command
		}));
	}

	public async didChooseRemove(): Promise<boolean> {
		this.open();
		return new Promise(resolve => {
			this.onClose = (): void => {
				if (this.remove && this.command && this.onSyncCallback) {
					this.plugin.commandStore.removeCommand(this.command.id);
					this.onSyncCallback();
				}
				resolve(this.remove ?? false);
			};
		});
	}

	public onClose(): void {
		if (this.root) {
			this.root.unmount();
			this.root = null;
		}
	}
}
