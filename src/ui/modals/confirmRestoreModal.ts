import { Modal } from "obsidian";
import { createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { t } from "i18next";
import SlashCommanderPlugin from "@/main";
import { confirmRestoreComponent } from "@/ui/components/confirmRestoreComponent";

/**
 * Modal for confirming restoration of default commands
 */
export default class ConfirmRestoreModal extends Modal {
	private root: Root | null = null;
	public restore = false;
	private onRestoreCallback: (() => Promise<void>) | undefined;

	public constructor(
		public plugin: SlashCommanderPlugin,
		onRestore?: () => Promise<void>
	) {
		super(plugin.app);
		this.onRestoreCallback = onRestore;
	}

	public async onOpen(): Promise<void> {
		this.titleEl.innerText = t("modals.viewer.restore_default.title");
		this.containerEl.style.zIndex = "99";
		this.root = createRoot(this.contentEl);
		this.root.render(createElement(confirmRestoreComponent, { 
			modal: this
		}));
	}

	public async didChooseRestore(): Promise<boolean> {
		this.open();
		return new Promise(resolve => {
			this.onClose = async (): Promise<void> => {
				if (this.restore && this.onRestoreCallback) {
					await this.onRestoreCallback();
				}
				resolve(this.restore);
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