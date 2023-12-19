import { PopoverSuggest } from "obsidian";
import SlashCommanderPlugin from "../main";
import { h, render } from "preact";
import { CommandIconPair } from "src/types";
import SuggestionComponent from "src/components/suggestionComponent";

export class StandaloneMenu extends PopoverSuggest<CommandIconPair> {
    plugin: SlashCommanderPlugin;
    menuElement: HTMLDivElement;

    constructor(plugin: SlashCommanderPlugin) {
        super(plugin.app);
        this.plugin = plugin;
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
            element.addEventListener('mousedown', (event) => {
                this.selectSuggestion(pair, event);
            });
            this.renderSuggestion(pair, element);
        }
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

    public close() {
        this.menuElement.remove();
    };
}