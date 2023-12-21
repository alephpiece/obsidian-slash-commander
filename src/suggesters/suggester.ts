// Credits go to https://github.com/liamcain/obsidian-periodic-notes
// and https://github.com/javalent/admonitions
import {
    App,
    FuzzyMatch,
    FuzzySuggestModal,
    Scope,
    SuggestModal,
    TextComponent
} from "obsidian";

import { createPopper, Instance as PopperInstance } from "@popperjs/core";
import { CommandIconPair } from "src/types";
import SlashCommanderPlugin from "src/main";
import { h, render } from "preact";
import SuggestionComponent from "src/components/suggestionComponent";

export default class Suggester<T> {
    public owner: SuggestModal<T>;
    public items: T[];
    public suggestions: HTMLDivElement[];
    public selectedItem: number;
    public containerEl: HTMLElement;
    public constructor(
        owner: SuggestModal<T>,
        containerEl: HTMLElement,
        scope: Scope
    ) {
        this.containerEl = containerEl;
        this.owner = owner;
        containerEl.on(
            "click",
            ".suggestion-item",
            this.onSuggestionClick.bind(this)
        );
        containerEl.on(
            "mousemove",
            ".suggestion-item",
            this.onSuggestionMouseover.bind(this)
        );

        scope.register([], "ArrowUp", () => {
            this.setSelectedItem(this.selectedItem - 1, true);
            return false;
        });

        scope.register([], "ArrowDown", () => {
            this.setSelectedItem(this.selectedItem + 1, true);
            return false;
        });

        scope.register([], "Enter", (evt) => {
            this.useSelectedItem(evt);
            return false;
        });

        scope.register([], "Tab", (evt) => {
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

        items.forEach((item) => {
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
        // if (Platform.isMobile) {
        //     this.chooseSuggestion(event);
        // }
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
    public emptyStateText = "No match found";
    public limit = 100;
    public constructor(app: App, inputEl: HTMLInputElement, items: T[]) {
        super(app);
        this.inputEl = inputEl;
        this.items = items;

        this.suggestEl = createDiv("suggestion-container");

        // this.suggestEl.style.width = `${inputEl.clientWidth*2}px`;
        this.suggestEl.style.width = `unset`;

        this.contentEl = this.suggestEl.createDiv("suggestion");

        this.suggester = new Suggester(this, this.contentEl, this.scope);

        this.scope.register([], "Escape", this.close.bind(this));

        this.inputEl.addEventListener("input", this.onInputChanged.bind(this));
        this.inputEl.addEventListener("focus", this.onInputChanged.bind(this));
        this.inputEl.addEventListener("blur", this.close.bind(this));
        this.suggestEl.on(
            "mousedown",
            ".suggestion-container",
            (event: MouseEvent) => {
                event.preventDefault();
            }
        );
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
        // TODO: Figure out a better way to do this. Idea from Periodic Notes plugin
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (<any>this.app).keymap.pushScope(this.scope);

        document.body.appendChild(this.suggestEl);
        this.popper = createPopper(this.inputEl, this.suggestEl, {
            placement: "bottom-start",
            modifiers: [
                // {
                //     name: "offset",
                //     options: {
                //         offset: [0, 6]
                //     }
                // },
                {
                    name: "flip",
                    options: {
                        fallbackPlacements: ["top"]
                    }
                }
            ]
        });

        // FIXME: hide input box
        this.inputEl.setCssStyles({
            maxWidth: "0",
            padding: "0 0 0 0",
        });
    }

    public close(): void {
        // TODO: Figure out a better way to do this. Idea from Periodic Notes plugin
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (<any>this.app).keymap.popScope(this.scope);

        this.suggester.setSuggestions([]);
        if (this.popper) {
            this.popper.destroy();
        }

        this.suggestEl.detach();
    }
    public createPrompt(prompts: HTMLSpanElement[]): void {
        if (!this.promptEl)
            this.promptEl = this.suggestEl.createDiv("prompt-instructions");
        const prompt = this.promptEl.createDiv("prompt-instruction");
        for (const p of prompts) {
            prompt.appendChild(p);
        }
    }
    public abstract onChooseItem(item: T, evt: MouseEvent | KeyboardEvent): void;
    public abstract getItemText(arg: T): string;
    public abstract getItems(): T[];
}

export class MenuSuggestionModal extends SuggestionModal<CommandIconPair> {
    public pairs: CommandIconPair[];
    public pair: CommandIconPair | undefined;
    public text: TextComponent;
    public constructor(
        public plugin: SlashCommanderPlugin,
        input: TextComponent,
        items: CommandIconPair[]
    ) {
        super(plugin.app, input.inputEl, items);
        this.pairs = [...items];
        this.text = input;

        this.createPrompts();

        this.inputEl.addEventListener("input", this.getItem.bind(this));
    }
    public createPrompts(): void { }
    public getItem(): void {
        const v = this.inputEl.value,
            pair = this.pairs.find(
                (pair) => pair.name === v.trim()
            );
        if (pair == this.pair) return;
        this.pair = pair;
        if (this.pairs) this.onInputChanged();
    }
    public getItemText(item: CommandIconPair): string {
        return item.name;
    }
    public onChooseItem(item: CommandIconPair): void {
        this.text.setValue(item.name);
        this.pair = item;
    }
    public selectSuggestion({ item }: FuzzyMatch<CommandIconPair>): void {
        if (item.id) {
            this.plugin.app.commands.executeCommandById(item.id);
        }
        this.text.inputEl.remove();
        this.close();
    }
    public renderSuggestion(result: FuzzyMatch<CommandIconPair>, el: HTMLElement): void {
        const { item } = result || {};
        if (!item) {
            const content = el.createDiv({
                cls: "suggestion-content icon"
            });
            content.setText(this.emptyStateText);
            content.parentElement?.addClass("is-selected");
            return;
        }

        render(
            h(SuggestionComponent, { plugin: this.plugin, result: result }),
            el
        );
    }
    public getItems(): CommandIconPair[] {
        return this.pairs;
    }
}