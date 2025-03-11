import { Command, setIcon, FuzzySuggestModal, FuzzyMatch } from "obsidian";
import t from "@/i18n";
import SlashCommanderPlugin from "@/main";

export default class AddCommandModal extends FuzzySuggestModal<Command> {
	private commands: Command[];

	public constructor(plugin: SlashCommanderPlugin) {
		super(plugin.app);
		this.commands = Object.values(plugin.app.commands.commands);
		this.setPlaceholder(t("Choose a command to add"));

		this.setInstructions([
			{
				command: "↑↓",
				purpose: t("to navigate"),
			},
			{
				command: "↵",
				purpose: t("to choose an icon"),
			},
			{
				command: "esc",
				purpose: t("to cancel"),
			},
		]);
	}

	public async awaitSelection(): Promise<Command> {
		this.open();
		return new Promise((resolve, reject) => {
			this.onChooseItem = (item): void => resolve(item);
			//This is wrapped inside a setTimeout, because onClose is called before onChooseItem
			this.onClose = (): number => window.setTimeout(() => reject("No Command selected"), 0);
		});
	}

	public renderSuggestion(item: FuzzyMatch<Command>, el: HTMLElement): void {
		el.addClass("mod-complex");
		const content = el.createDiv({ cls: "suggestion-content" });
		content.createDiv({ cls: "suggestion-title" }).setText(item.item.name);

		//Append the icon if available
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

	// This will be overriden anyway, but typescript complains if it's not declared
	// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-empty-function
	public onChooseItem(item: Command, evt: MouseEvent | KeyboardEvent): void {}
}
