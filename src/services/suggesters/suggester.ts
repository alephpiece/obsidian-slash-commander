// Credits go to https://github.com/liamcain/obsidian-periodic-notes
// and https://github.com/javalent/admonitions
import {
	App,
	FuzzyMatch,
	FuzzySuggestModal,
	Modal,
	Scope,
	SuggestModal,
	TextComponent,
} from "obsidian";

import { createPopper, Instance as PopperInstance } from "@popperjs/core";
import { SlashCommand } from "@/data/models/SlashCommand";
import SlashCommanderPlugin from "@/main";
import { createElement } from "react";
import { createRoot } from "react-dom/client";
import SuggestionComponent from "@/ui/components/suggestionComponent";
import SuggestionGroupComponent from "@/ui/components/suggestionGroupComponent";
import { buildQueryPattern } from "@/services/utils/search";
import { t } from "i18next";

export default class Suggester<T> {
	public owner: SuggestModal<T>;
	public items: T[];
	public suggestions: HTMLDivElement[];
	public selectedItem: number;
	public containerEl: HTMLElement;
	public constructor(owner: SuggestModal<T>, containerEl: HTMLElement, scope: Scope) {
		this.containerEl = containerEl;
		this.owner = owner;
		containerEl.on("click", ".suggestion-item", this.onSuggestionClick.bind(this));
		containerEl.on("mousemove", ".suggestion-item", this.onSuggestionMouseover.bind(this));

		scope.register([], "ArrowUp", () => {
			this.setSelectedItem(this.selectedItem - 1, true);
			return false;
		});

		scope.register([], "ArrowDown", () => {
			this.setSelectedItem(this.selectedItem + 1, true);
			return false;
		});

		scope.register([], "Enter", evt => {
			this.useSelectedItem(evt);
			return false;
		});

		scope.register([], "Tab", evt => {
			this.useSelectedItem(evt);
			return false;
		});
	}
	public chooseSuggestion(evt: KeyboardEvent | MouseEvent): void {
		if (!this.items || !this.items.length) return;
		const currentValue = this.items[this.selectedItem];
		if (currentValue) {
			this.owner.selectSuggestion(currentValue, evt);
		}
	}
	public onSuggestionClick(event: MouseEvent, el: HTMLDivElement): void {
		event.preventDefault();
		if (!this.suggestions || !this.suggestions.length) return;

		const item = this.suggestions.indexOf(el);
		this.setSelectedItem(item, false);
		this.useSelectedItem(event);
	}

	public onSuggestionMouseover(event: MouseEvent, el: HTMLDivElement): void {
		if (!this.suggestions || !this.suggestions.length) return;
		const item = this.suggestions.indexOf(el);
		this.setSelectedItem(item, false);
	}
	public empty(): void {
		this.containerEl.empty();
	}
	public setSuggestions(items: T[]): void {
		this.containerEl.empty();
		const els: HTMLDivElement[] = [];

		items.forEach(item => {
			const suggestionEl = this.containerEl.createDiv("suggestion-item");
			this.owner.renderSuggestion(item, suggestionEl);
			els.push(suggestionEl);
		});
		this.items = items;
		this.suggestions = els;
		this.setSelectedItem(0, false);
	}
	public useSelectedItem(event: MouseEvent | KeyboardEvent): void {
		if (!this.items || !this.items.length) return;
		const currentValue = this.items[this.selectedItem];
		if (currentValue) {
			this.owner.selectSuggestion(currentValue, event);
		}
	}
	public wrap(value: number, size: number): number {
		return ((value % size) + size) % size;
	}
	public setSelectedItem(index: number, scroll: boolean): void {
		const nIndex = this.wrap(index, this.suggestions.length);
		const prev = this.suggestions[this.selectedItem];
		const next = this.suggestions[nIndex];

		if (prev) prev.removeClass("is-selected");
		if (next) next.addClass("is-selected");

		this.selectedItem = nIndex;

		if (scroll) {
			next.scrollIntoView(false);
		}
	}
}

export abstract class SuggestionModal<T> extends FuzzySuggestModal<T> {
	public items: T[] = [];
	public suggestions: HTMLDivElement[];
	public popper: PopperInstance;
	public scope: Scope = new Scope();
	public suggester: Suggester<FuzzyMatch<T>>;
	public suggestEl: HTMLDivElement;
	public promptEl: HTMLDivElement;
	public emptyStateText = t("suggester.no_matches");
	public limit = 100;
	public constructor(app: App, inputEl: HTMLInputElement, items: T[]) {
		super(app);
		this.inputEl = inputEl;
		this.items = items;

		this.suggestEl = createDiv("suggestion-container");

		this.suggestEl.style.width = `unset`;

		this.contentEl = this.suggestEl.createDiv("suggestion");

		this.suggester = new Suggester(this, this.contentEl, this.scope);

		this.scope.register([], "Escape", this.close.bind(this));

		this.inputEl.addEventListener("input", this.onInputChanged.bind(this));
		this.inputEl.addEventListener("focus", this.onInputChanged.bind(this));
		this.inputEl.addEventListener("blur", this.close.bind(this));
		this.suggestEl.on("mousedown", ".suggestion-container", (event: MouseEvent) => {
			event.preventDefault();
		});
	}
	public empty(): void {
		this.suggester.empty();
	}
	public onInputChanged(): void {
		const inputStr = this.modifyInput(this.inputEl.value);
		const suggestions = this.getSuggestions(inputStr);
		if (suggestions.length > 0) {
			this.suggester.setSuggestions(suggestions.slice(0, this.limit));
		} else {
			this.onNoSuggestion();
		}
		this.open();
	}

	public modifyInput(input: string): string {
		return input;
	}
	public onNoSuggestion(): void {
		this.empty();
		this.renderSuggestion(
			null as unknown as FuzzyMatch<T>,
			this.contentEl.createDiv("suggestion-item")
		);
	}
	public open(): void {
		(<any>this.app).keymap.pushScope(this.scope);

		document.body.appendChild(this.suggestEl);
		this.popper = createPopper(this.inputEl, this.suggestEl, {
			placement: "bottom-start",
			modifiers: [
				{
					name: "flip",
					options: {
						fallbackPlacements: ["top"],
					},
				},
			],
		});

		this.inputEl.setCssStyles({
			maxWidth: "0",
			padding: "0 0 0 0",
		});
	}

	public close(): void {
		(<any>this.app).keymap.popScope(this.scope);

		this.suggester.setSuggestions([]);
		if (this.popper) {
			this.popper.destroy();
		}

		this.suggestEl.detach();
	}
	public createPrompt(prompts: HTMLSpanElement[]): void {
		if (!this.promptEl) this.promptEl = this.suggestEl.createDiv("prompt-instructions");
		const prompt = this.promptEl.createDiv("prompt-instruction");
		for (const p of prompts) {
			prompt.appendChild(p);
		}
	}
	public abstract onChooseItem(item: T, evt: MouseEvent | KeyboardEvent): void;
	public abstract getItemText(arg: T): string;
	public abstract getItems(): T[];
}

export class MenuSuggestionModal extends SuggestionModal<SlashCommand> {
	public items: SlashCommand[];
	public slashcmd: SlashCommand | undefined;
	public text: TextComponent;
	public constructor(
		public plugin: SlashCommanderPlugin,
		input: TextComponent,
		items: SlashCommand[]
	) {
		super(plugin.app, input.inputEl, items);
		this.items = [...items];
		this.text = input;

		this.createPrompts();

		this.inputEl.addEventListener("input", this.getItem.bind(this));
	}
	public createPrompts(): void {
		// Implement prompt creation if needed
	}
	public getItem(): void {
		// Empty method
	}
	public getItemText(item: SlashCommand): string {
		return item.name;
	}
	public onChooseItem(item: SlashCommand): void {
		if (item) this.plugin.app.commands.executeCommandById(item.id);
	}
	public selectSuggestion({ item }: FuzzyMatch<SlashCommand>): void {
		this.onChooseItem(item);
		this.close();
		this.text.inputEl.remove();
	}
	public renderSuggestion(result: FuzzyMatch<SlashCommand>, el: HTMLElement): void {
		if (!result) {
			const div = el.createDiv();
			div.setText(this.emptyStateText);
			return;
		}
		if (result.item.isChild) return;

		const root = createRoot(el);
		root.render(createElement(SuggestionComponent, { plugin: this.plugin, result }));
	}
	public getItems(): SlashCommand[] {
		return this.items;
	}
}
