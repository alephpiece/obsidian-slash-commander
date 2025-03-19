import { SuggestModal, TextComponent } from "obsidian";
import SlashCommanderPlugin from "@/main";
import { SlashCommand } from "@/data/models/SlashCommand";
import { MenuSuggestionModal } from "./suggester";

export class SubSuggest {
    private plugin: SlashCommanderPlugin;
    private anchor: HTMLElement;
    private items: SlashCommand[];
    private search: TextComponent;

    public constructor(plugin: SlashCommanderPlugin, anchor: HTMLElement, items: SlashCommand[]) {
        this.plugin = plugin;
        this.items = items;
        this.anchor = anchor;
    }

    public open(): void {
        const scrollArea = this.plugin.scrollArea as HTMLElement;
        if (!scrollArea || this.items.length == 0) return;

        // Hidden search bar
        this.search = new TextComponent(scrollArea);
        this.search.inputEl.addEventListener("blur", this.close.bind(this));
        this.search.inputEl.addEventListener("keydown", (event) => {
            if (event.key == "Escape") {
                // this.returnFocus();
                this.close();
            }
        });

        const modal = new MenuSuggestionModal(this.plugin, this.search, this.items);
        modal.open();

        // Figure out the popover position
        const anchorRect = this.anchor.getBoundingClientRect();
        const scrollAreaRect = scrollArea.getBoundingClientRect();

        this.search.inputEl.setCssStyles({
            top: `${anchorRect.top - scrollAreaRect.top}px`,
            left: `${anchorRect.left - scrollAreaRect.left}px`,
            position: "absolute",
            opacity: "0",
        });

        // Focus on the input box
        this.search.inputEl.focus();
    }

    public close(): void {
        this.search?.inputEl?.remove();
        this.plugin.app.workspace.activeEditor?.editor?.focus();
    }
}
