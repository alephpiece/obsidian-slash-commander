import { Command, setIcon, FuzzySuggestModal, FuzzyMatch } from "obsidian";
import { t } from "i18next";
import SlashCommanderPlugin from "@/main";

export default class AddCommandModal extends FuzzySuggestModal<Command> {
	private commands: Command[];

	public constructor(plugin: SlashCommanderPlugin) {
		super(plugin.app);
		this.commands = Object.values(plugin.app.commands.commands);
		this.setPlaceholder(t("modals.new_command.placeholder"));

		this.setInstructions([
			{
				command: "↑↓",
				purpose: t("modals.to_navigate"),
			},
			{
				command: "↵",
				purpose: t("modals.new_icon.choose"),
			},
			{
				command: "esc",
				purpose: t("modals.to_cancel"),
			},
		]);
	}

	public async awaitSelection(): Promise<Command> {
		this.open();
		return new Promise((resolve, reject) => {
			this.onChooseItem = (item): void => resolve(item);
			this.onClose = (): number => window.setTimeout(() => reject("No Command selected"), 0);
		});
	}

	public renderSuggestion(item: FuzzyMatch<Command>, el: HTMLElement): void {
		el.addClass("mod-complex");
		const content = el.createDiv({ cls: "suggestion-content" });
		content.createDiv({ cls: "suggestion-title" }).setText(item.item.name);

		if (item.item.icon) {
			const aux = el.createDiv({ cls: "suggestion-aux" });
			const iconElement = aux.createSpan({ cls: "suggestion-flair" });
			setIcon(iconElement, item.item.icon);
		}
	}

	public getItems(): Command[] {
		return this.commands;
	}

	public getItemText(item: Command): string {
		return item.name;
	}

	public onChooseItem(item: Command, evt: MouseEvent | KeyboardEvent): void {}
}
