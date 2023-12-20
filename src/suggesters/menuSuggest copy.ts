import { KeymapEventHandler, PopoverSuggest, Scope } from "obsidian";
import { h, render } from "preact";
import SlashCommanderPlugin from "../main";
import { getFuzzySuggestions } from "../utils/search";
import { CommandIconPair } from "src/types";
import SuggestionComponent from "src/components/suggestionComponent";
import Suggester from "./suggester";
import { MenuSuggestion } from "src/types";

// Credits go to https://github.com/esm7/obsidian-map-view
export class MenuSuggest extends PopoverSuggest<CommandIconPair> {
    private plugin: SlashCommanderPlugin;
    private suggestionEl: HTMLDivElement;
    private parentEl: HTMLElement;
    private suggestions: MenuSuggestion[] = [];
    private selection?: MenuSuggestion;
    private selectedItem: number;
    private registeredEvents: [string, any][] = [];
    private suggester: Suggester<MenuSuggestion>;
    private scope: Scope = new Scope();
    private emptyStateText: string = "No match found";
    private limit: number = 20;

    public constructor(
        plugin: SlashCommanderPlugin,
        parentEl: HTMLElement) {
        super(plugin.app);
        this.plugin = plugin;
        this.parentEl = parentEl;
        this.suggester = new Suggester(this, this.parentEl, this.scope);
    }

    public open(): void {
        // See https://github.com/javalent/admonitions
        (<any>this.app).keymap.pushScope(this.scope);

        this.suggestionEl = this.parentEl.createDiv({
            cls: "suggestion-container cmdr-standalone-menu",
            attr: {
                id: "standalone-menu",
                style: "top:200px;left:100px"
            }
        });

        for (const pair of this.getSuggestions()) {
            const element = this.suggestionEl.createDiv({
                cls: "suggestion-item cmdr-standalone-menu-item",
            });
            this.suggestions.push({ pair, element });
            // Events
            element.addEventListener("mousedown", (event) => {
                this.selectSuggestion(pair, event);
            });
            element.addEventListener("mouseover", () => {
                this.updateSelection({ pair, element });
            });
            // Render
            this.renderSuggestion(pair, element);
        }

        if (this.suggestions.length != 0)
            this.updateSelection(this.suggestions[0]);

        // this.parentEl.addEventListener("keydown", keyDown);
        // this.registeredEvents.push(
        //     ['keydown', keyDown]
        // );

        this.scope.register([], "ArrowUp", () => {
            this.setSelectedItem(this.selectedItem - 1, true);
            return false;
        });

        this.scope.register([], "ArrowDown", () => {
            this.setSelectedItem(this.selectedItem + 1, true);
            return false;
        });

        this.scope.register([], "Enter", (evt) => {
            this.useSelectedItem(evt);
            return false;
        });

        this.scope.register([], "Tab", (evt) => {
            this.useSelectedItem(evt);
            return false;
        });
    }

    public async keyDown(event: KeyboardEvent): Promise<void> {
        event.stopPropagation();
        event.preventDefault();

        if (event.key == "Escape") {
            this.close();
        }
        else if (event.key == "Enter" && this.selection) {
            this.selectSuggestion(this.selection.pair, event);
        }
        else if (event.key == "ArrowDown" || event.key == "ArrowUp") {
            if (this.suggestions.length == 0) return;
            let index = this.suggestions.findIndex(
                (value) => value == this.selection
            );
            const direction = event.key == 'ArrowDown' ? 1 : -1;
            index += direction + this.suggestions.length;
            index = index % this.suggestions.length;
            this.updateSelection(this.suggestions[index]);
        }
    }

    public getSuggestions(): CommandIconPair[] {
        // FIXME: search all commands now
        return getFuzzySuggestions("", this.plugin);
    }

    public renderSuggestion(pair: CommandIconPair, el: HTMLElement): void {
        render(
            h(SuggestionComponent, { plugin: this.plugin, pair: pair }),
            el
        );
    }

    public selectSuggestion(pair: CommandIconPair, _evt: MouseEvent | KeyboardEvent,): void {
        if (pair.id) {
            this.plugin.app.commands.executeCommandById(pair.id);
        }
        this.close();
    }

    public updateSelection(newSelection: MenuSuggestion): void {
        if (this.selection && this.selection.element) {
            this.selection.element.removeClass('is-selected');
        }
        newSelection.element?.addClass('is-selected');
        this.selection = newSelection;
        this.selection.element.scrollIntoView(false);
    }

    public close(): void {
        // See https://github.com/javalent/admonitions
        (<any>this.app).keymap.popScope(this.scope);

        this.suggestionEl.remove();
        this.selection = undefined;
        this.suggestions = [];
        // for (const [name, handler] of this.registeredEvents) {
        //     this.parentEl.removeEventListener(name, handler);
        // }
    }
}