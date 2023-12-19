import { PopoverSuggest } from "obsidian";
import SlashCommanderPlugin from "../main";
import { h, render } from "preact";
import { CommandIconPair } from "src/types";
import SuggestionComponent from "src/components/suggestionComponent";

interface StandaloneMenuSelection {
    pair: CommandIconPair;
    element: HTMLDivElement;
}

export class StandaloneMenu extends PopoverSuggest<CommandIconPair> {
    plugin: SlashCommanderPlugin;
    menuElement: HTMLDivElement;
    parentElement: HTMLElement;
    registeredEvents: [string, any][] = [];
    suggestions: StandaloneMenuSelection[];
    selection?: StandaloneMenuSelection;

    constructor(plugin: SlashCommanderPlugin, parentElement: HTMLElement) {
        super(plugin.app);
        this.plugin = plugin;
        this.parentElement = parentElement;
    }

    public open() {
        this.menuElement = this.app.workspace.containerEl.createDiv({
            cls: "suggestion-container cmdr-standalone-menu",
            attr: {
                id: "standalone-menu",
                style: "top:200px;left:100px"
            }
        })

        for (const pair of this.getSuggestions()) {
            const element = this.menuElement.createDiv({
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

        this.updateSelection(this.suggestions[0]);

        // Events for the parent
        const keyDown = async (event: KeyboardEvent) => {
            if (event.key == "Enter" && this.selection) {
                this.selectSuggestion(this.selection.pair, event);
            }
            else if (event.key == 'ArrowDown' || event.key == 'ArrowUp') {
                if (this.suggestions.length == 0) return;
                let index = this.suggestions.findIndex(
                    (value) => value == this.selection
                );
                const direction = event.key == 'ArrowDown' ? 1 : -1;
                index += direction;
                if (index >= this.suggestions.length) index = 0;
                if (index < 0) index = this.suggestions.length - 1;
                this.updateSelection(this.suggestions[index]);
            }
        };
        this.parentElement.addEventListener("keydown", keyDown);
        this.registeredEvents.push(
            ['keydown', keyDown]
        );
    }

    public getSuggestions(): CommandIconPair[] {
        // FIXME
        return this.plugin.manager.pairs;
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

    public updateSelection(newSelection: StandaloneMenuSelection) {
        if (this.selection && this.selection.element) {
            this.selection.element.removeClass('is-selected');
        }
        newSelection.element?.addClass('is-selected');
        this.selection = newSelection;
    }

    public close() {
        this.menuElement.remove();
        this.selection = undefined;
        this.suggestions = [];
        for (const [name, handler] of this.registeredEvents)
            this.parentElement.removeEventListener(name, handler);
    };
}