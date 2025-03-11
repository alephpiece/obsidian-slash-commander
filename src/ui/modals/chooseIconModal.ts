import { ICON_LIST } from "@/data/constants/icons";
import { setIcon, FuzzySuggestModal, FuzzyMatch } from "obsidian";
import SlashCommanderPlugin from "@/main";
import t from "@/i18n";

export default class ChooseIconModal extends FuzzySuggestModal<string> {
	public constructor(plugin: SlashCommanderPlugin) {
		super(plugin.app);
		this.setPlaceholder(t("Choose an icon for your new command"));

		this.setInstructions([
			{
				command: "↑↓",
				purpose: t("to navigate"),
			},
			{
				command: "↵",
				purpose: t("to choose a custom icon"),
			},
			{
				command: "esc",
				purpose: t("to cancel"),
			},
		]);
	}

	public async awaitSelection(): Promise<string> {
		this.open();
		return new Promise((resolve, reject) => {
			this.onChooseItem = (item): void => resolve(item);
			//This is wrapped inside a setTimeout, because onClose is called before onChooseItem
			this.onClose = (): number => window.setTimeout(() => reject("No Icon selected"), 0);
		});
	}

	public renderSuggestion(item: FuzzyMatch<string>, el: HTMLElement): void {
		el.addClass("mod-complex");
		const content = el.createDiv({ cls: "suggestion-content" });
		content
			.createDiv({ cls: "suggestion-title" })
			.setText(
				item.item
					.replace(/-/g, " ")
					.replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase())
			);

		const aux = el.createDiv({ cls: "suggestion-aux" });
		const iconElement = aux.createSpan({ cls: "suggestion-flair" });
		setIcon(iconElement, item.item);
	}

	public getItems(): string[] {
		return ICON_LIST;
	}

	public getItemText(item: string): string {
		return item;
	}

	// This will be overriden anyway, but typescript complains if it's not declared
	// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-empty-function
	public onChooseItem(_: string, __: MouseEvent | KeyboardEvent): void {}
}
