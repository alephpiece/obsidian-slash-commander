import { SuggestModal } from "obsidian";
import SlashCommanderPlugin from "@/main";
import { t } from "i18next";

export default class ChooseCustomNameModal extends SuggestModal<string> {
	// This is used in onOpen, not sure why eslint doesn't recognize it
	// eslint-disable-next-line no-unused-vars
	public constructor(
		plugin: SlashCommanderPlugin,
		private defaultName: string
	) {
		super(plugin.app);
		this.setPlaceholder(t("modals.bind.name.placeholder"));
		this.resultContainerEl.style.display = "none";

		this.setInstructions([
			{
				command: "",
				purpose: t("modals.new_name.detail"),
			},
			{
				command: "↵",
				purpose: t("modals.to_save"),
			},
			{
				command: "esc",
				purpose: t("modals.to_cancel"),
			},
		]);
	}

	public onOpen(): void {
		super.onOpen();

		this.inputEl.value = this.defaultName;
		const wrapper = createDiv({ cls: "cmdr-name-input-wrapper" });
		this.inputEl.parentNode?.insertBefore(wrapper, this.inputEl);
		wrapper.appendChild(this.inputEl);
		if (wrapper.parentElement) {
			wrapper.parentElement.style.display = "block";
		}

		const btn = createEl("button", { text: t("common.save"), cls: "mod-cta" });
		btn.style.position = "relative";
		btn.style.left = "-2.5em";
		btn.onclick = (e): void => this.selectSuggestion(this.inputEl.value, e);
		wrapper.appendChild(btn);
	}

	public async awaitSelection(): Promise<string> {
		this.open();
		return new Promise((resolve, reject) => {
			this.onChooseSuggestion = (item): void => resolve(item);
			//This is wrapped inside a setTimeout, because onClose is called before onChooseItem
			this.onClose = (): number => window.setTimeout(() => reject("No Name selected"), 0);
		});
	}

	public getSuggestions(query: string): string[] | Promise<string[]> {
		return [query];
	}

	// This isn't needed, since we just want a text field without options
	// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-empty-function
	public renderSuggestion(value: string, el: HTMLElement): void {}

	// This will be overriden anyway, but typescript complains if it's not declared
	// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-empty-function
	public onChooseSuggestion(item: string, evt: MouseEvent | KeyboardEvent): void {}
}
