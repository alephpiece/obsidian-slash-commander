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
    owner: SuggestModal<T>;
    items: T[];
    suggestions: HTMLDivElement[];
    selectedItem: number;
    containerEl: HTMLElement;
    constructor(
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
    chooseSuggestion(evt: KeyboardEvent | MouseEvent) {
        if (!this.items || !this.items.length) return;
        const currentValue = this.items[this.selectedItem];
        if (currentValue) {
            this.owner.selectSuggestion(currentValue, evt);
        }
    }
    onSuggestionClick(event: MouseEvent, el: HTMLDivElement): void {
        event.preventDefault();
        if (!this.suggestions || !this.suggestions.length) return;

        const item = this.suggestions.indexOf(el);
        this.setSelectedItem(item, false);
        this.useSelectedItem(event);
    }

    onSuggestionMouseover(event: MouseEvent, el: HTMLDivElement): void {
        if (!this.suggestions || !this.suggestions.length) return;
        const item = this.suggestions.indexOf(el);
        this.setSelectedItem(item, false);
    }
    empty() {
        this.containerEl.empty();
    }
    setSuggestions(items: T[]) {
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
    useSelectedItem(event: MouseEvent | KeyboardEvent) {
        if (!this.items || !this.items.length) return;
        const currentValue = this.items[this.selectedItem];
        if (currentValue) {
            this.owner.selectSuggestion(currentValue, event);
        }
        // if (Platform.isMobile) {
        //     this.chooseSuggestion(event);
        // }
    }
    wrap(value: number, size: number): number {
        return ((value % size) + size) % size;
    }
    setSelectedItem(index: number, scroll: boolean) {
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
    items: T[] = [];
    suggestions: HTMLDivElement[];
    popper: PopperInstance;
    scope: Scope = new Scope();
    suggester: Suggester<FuzzyMatch<T>>;
    suggestEl: HTMLDivElement;
    promptEl: HTMLDivElement;
    emptyStateText: string = "No match found";
    limit: number = 20;
    constructor(app: App, inputEl: HTMLInputElement, items: T[]) {
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
    empty() {
        this.suggester.empty();
    }
    onInputChanged(): void {
        const inputStr = this.modifyInput(this.inputEl.value);
        const suggestions = this.getSuggestions(inputStr);
        if (suggestions.length > 0) {
            this.suggester.setSuggestions(suggestions.slice(0, this.limit));
        } else {
            this.onNoSuggestion();
        }
        this.open();
    }

    modifyInput(input: string): string {
        return input;
    }
    onNoSuggestion() {
        this.empty();
        this.renderSuggestion(
            null as unknown as FuzzyMatch<T>,
            this.contentEl.createDiv("suggestion-item")
        );
    }
    open(): void {
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

    close(): void {
        // TODO: Figure out a better way to do this. Idea from Periodic Notes plugin
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (<any>this.app).keymap.popScope(this.scope);

        this.suggester.setSuggestions([]);
        if (this.popper) {
            this.popper.destroy();
        }

        this.suggestEl.detach();
    }
    createPrompt(prompts: HTMLSpanElement[]) {
        if (!this.promptEl)
            this.promptEl = this.suggestEl.createDiv("prompt-instructions");
        let prompt = this.promptEl.createDiv("prompt-instruction");
        for (let p of prompts) {
            prompt.appendChild(p);
        }
    }
    abstract onChooseItem(item: T, evt: MouseEvent | KeyboardEvent): void;
    abstract getItemText(arg: T): string;
    abstract getItems(): T[];
}

export class MenuSuggestionModal extends SuggestionModal<CommandIconPair> {
    pairs: CommandIconPair[];
    pair: CommandIconPair | undefined;
    text: TextComponent;
    constructor(
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
    createPrompts() { }
    getItem() {
        const v = this.inputEl.value,
            pair = this.pairs.find(
                (pair) => pair.name === v.trim()
            );
        if (pair == this.pair) return;
        this.pair = pair;
        if (this.pairs) this.onInputChanged();
    }
    getItemText(item: CommandIconPair) {
        return item.name;
    }
    onChooseItem(item: CommandIconPair) {
        this.text.setValue(item.name);
        this.pair = item;
    }
    selectSuggestion({ item }: FuzzyMatch<CommandIconPair>) {
        if (item.id) {
            this.plugin.app.commands.executeCommandById(item.id);
        }
        this.text.inputEl.remove();
        this.close();
    }
    renderSuggestion(result: FuzzyMatch<CommandIconPair>, el: HTMLElement) {
        let { item, match: matches } = result || {};
        let content = el.createDiv({
            cls: "suggestion-content icon"
        });
        if (!item) {
            content.setText(this.emptyStateText);
            content.parentElement?.addClass("is-selected");
            return;
        }

        render(
            h(SuggestionComponent, { plugin: this.plugin, pair: item }),
            el
        );

        // TODO: highlight matched text
        // render(h(ObsidianIcon, {icon: item.icon, size: 20}), content);

        // const matchElements = matches.matches.map((m) => {
        //     return createSpan("suggestion-highlight");
        // });
        // for (let i = 0; i < item.name.length; i++) {
        //     let match = matches.matches.find((m) => m[0] === i);
        //     console.log(matches.matches);
        //     console.log(match);
        //     if (match) {
        //         let element = matchElements[matches.matches.indexOf(match)];
        //         content.appendChild(element);
        //         element.appendText(item.name.substring(match[0], match[1]));

        //         i += match[1] - match[0] - 1;
        //         continue;
        //     }

        //     content.appendText(item.name[i]);
        // }
    }
    getItems() {
        return this.pairs;
    }
}