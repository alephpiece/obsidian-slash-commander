import { TextComponent } from "obsidian";
import SlashCommanderPlugin from "../main";
import { MenuSuggestionModal } from "./suggester";

export class MenuSuggest {
    private plugin: SlashCommanderPlugin;
    private parentEl: HTMLElement;
    private search: TextComponent;

    public constructor(
        plugin: SlashCommanderPlugin,
        parentEl: HTMLElement) {
        this.plugin = plugin;
        this.parentEl = parentEl;
    }

    public open(): void {
        this.search = new TextComponent(this.parentEl);
        this.search.inputEl.addEventListener("keydown", (event) => {
            if (event.key == "Escape")
                this.close();
        });
        this.search.inputEl.setCssStyles({
            top: "200px",
            left: "100px",
            position: "absolute",
        });
        const modal = new MenuSuggestionModal(
            this.plugin,
            this.search,
            this.plugin.manager.pairs);

        modal.open();
        this.search.inputEl.focus();
    }

    public close(): void {
        this.search.inputEl.remove();
    }
}