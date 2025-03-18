import { TextComponent } from "obsidian";
import SlashCommanderPlugin from "@/main";
import { MenuSuggestionModal } from "./suggester";
import { Coords, EnhancedEditor } from "@/data/models/Settings";
import { SlashCommandMatch } from "@/services/search";
import { useSettingStore } from "@/data/stores/useSettingStore";
import { SlashCommand } from "@/data/models/SlashCommand";

export class MenuSuggest {
    private plugin: SlashCommanderPlugin;
    private editor: EnhancedEditor | null;
    private scrollArea: HTMLDivElement | undefined;
    private search: TextComponent;

    public constructor(
        plugin: SlashCommanderPlugin,
        editor: EnhancedEditor | null,
        scrollArea: Element | undefined
    ) {
        this.plugin = plugin;
        this.editor = editor;
        this.scrollArea = scrollArea as HTMLDivElement | undefined;
    }

    public open(): void {
        if (!this.scrollArea || !this.editor || !this.editor.hasFocus()) return;

        this.search = new TextComponent(this.scrollArea);

        // Additional events
        this.search.inputEl.addEventListener("blur", this.returnFocus.bind(this));
        this.search.inputEl.addEventListener("keydown", (event) => {
            if (event.key == "Escape") {
                this.returnFocus();
                // this.close();
            }
        });

        // Cursor position
        const cursor = this.editor.getCursor("from");

        // Filter suggestions and open the menu modal
        const onNewLine = cursor.ch == 0;
        const validCommands = useSettingStore.getState().getValidCommands();

        const modal = new MenuSuggestionModal(
            this.plugin,
            this.search,
            validCommands.filter(
                (pair: SlashCommand) =>
                    (onNewLine && pair.triggerMode != "inline") ||
                    (!onNewLine && pair.triggerMode != "newline")
            )
        );

        modal.open();

        const { height: menuHeight } = this.search.inputEl.getBoundingClientRect();
        const { width: menuWidth } = modal.suggestEl.getBoundingClientRect();

        // Figure out the popover position
        // Credits go to https://github.com/Jambo2018/notion-assistant-plugin
        // and https://github.com/chetachiezikeuzor/Highlightr-Plugin
        let coords: Coords;

        if (this.editor.cursorCoords) {
            coords = this.editor.cursorCoords(true, "window");
        } else if (this.editor.coordsAtPos) {
            const offset = this.editor.posToOffset(cursor);
            coords = this.editor.cm.coordsAtPos?.(offset) ?? this.editor.coordsAtPos(offset);
        } else {
            return;
        }

        const scrollRect = this.scrollArea.getBoundingClientRect();

        let top = coords.top,
            left = coords.right;
        top += this.scrollArea.scrollTop - scrollRect.top;
        left -= scrollRect.left;

        const rightDis = left + menuWidth - scrollRect.width;
        if (rightDis > 0) {
            left -= rightDis;
        }

        const upDis = top + menuHeight - this.scrollArea.scrollTop - this.scrollArea.clientHeight;
        if (upDis > 0) {
            this.scrollArea.scrollTo(0, this.scrollArea.scrollTop + upDis);
        }

        this.search.inputEl.setCssStyles({
            top: `${top}px`,
            left: `${left}px`,
            position: "absolute",
            opacity: "0",
        });

        // Focus on the input box
        this.search.inputEl.focus();
    }

    public close(): void {
        this.search?.inputEl?.remove();
    }

    public returnFocus(): void {
        this.editor?.focus();
    }
}
