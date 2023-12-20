import { TextComponent } from "obsidian";
import SlashCommanderPlugin from "../main";
import { MenuSuggestionModal } from "./suggester";
import { Coords, EnhancedEditor } from "src/types";

export class MenuSuggest {
    private plugin: SlashCommanderPlugin;
    private editor: EnhancedEditor;
    private scrollArea: HTMLDivElement | undefined;
    private search: TextComponent;

    public constructor(
        plugin: SlashCommanderPlugin,
        editor: EnhancedEditor,
        scrollArea: Element | undefined,
        ) {
        this.plugin = plugin;
        this.editor = editor;
        this.scrollArea = scrollArea as HTMLDivElement | undefined;
    }

    public open(): void {
        if (!this.scrollArea ||
            !this.editor ||
            !this.editor.hasFocus())
            return;

        this.search = new TextComponent(this.scrollArea);
        this.search.inputEl.addEventListener("keydown", (event) => {
            if (event.key == "Escape")
                this.close();
        });

        const modal = new MenuSuggestionModal(
            this.plugin,
            this.search,
            this.plugin.manager.pairs);

        modal.open();

        const { height: menuHeight } = this.search.inputEl.getBoundingClientRect();
        const { width: menuWidth } = modal.suggestEl.getBoundingClientRect();

        // Figure out the popover position
        // Credits go to https://github.com/Jambo2018/notion-assistant-plugin
        // and https://github.com/chetachiezikeuzor/Highlightr-Plugin
        const cursor = this.editor.getCursor("from");
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

        coords.top += this.scrollArea.scrollTop - scrollRect.top;
        coords.right -= scrollRect.left;

        const rightDis = coords.right + menuWidth - scrollRect.width;
		if (rightDis > 0) {
			coords.right -= rightDis;
		}

		const upDis =
			coords.top + menuHeight -
			this.scrollArea.scrollTop -
			this.scrollArea.clientHeight;
		if (upDis > 0) {
			this.scrollArea.scrollTo(0, this.scrollArea.scrollTop + upDis);
		}

        console.log(coords);

        this.search.inputEl.setCssStyles({
            top: `${coords.top}px`,
            left: `${coords.right}px`,
            position: "absolute",
            opacity: "0"
        });

        // Focus on the input box
        this.search.inputEl.focus();
    }

    public close(): void {
        this.search.inputEl.remove();
    }
}