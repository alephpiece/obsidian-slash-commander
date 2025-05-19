import { t } from "i18next";
import { FuzzyMatch, FuzzySuggestModal, setIcon } from "obsidian";

import { ICON_LIST } from "@/data/constants/icons";
import { SlashCommand } from "@/data/models/SlashCommand";
import SlashCommanderPlugin from "@/main";

/**
 * Modal for choosing an icon for a command
 * Allows users to search and select from available icons
 */
export default class ChooseIconModal extends FuzzySuggestModal<string> {
    private command: SlashCommand | undefined;
    private onSyncCallback: (() => void) | undefined;

    public constructor(plugin: SlashCommanderPlugin, command?: SlashCommand, onSync?: () => void) {
        super(plugin.app);
        this.command = command;
        this.onSyncCallback = onSync;
        this.setPlaceholder(t("modals.bind.icon.placeholder"));

        this.setInstructions([
            {
                command: "↑↓",
                purpose: t("modals.to_navigate"),
            },
            {
                command: "↵",
                purpose: t("modals.to_save"),
            },
            {
                command: "esc",
                purpose: t("modals.to_cancel"),
            },
        ]);
    }

    public async awaitSelection(): Promise<string> {
        this.open();
        return new Promise((resolve, reject) => {
            this.onChooseItem = (item): void => resolve(item);
            this.onClose = (): number => window.setTimeout(() => reject("No Icon selected"), 0);
        });
    }

    public renderSuggestion(item: FuzzyMatch<string>, el: HTMLElement): void {
        el.addClass("mod-complex");
        const content = el.createDiv({ cls: "suggestion-content" });
        content
            .createDiv({ cls: "suggestion-title" })
            .setText(
                item.item
                    .replace(/-/g, " ")
                    .replace(/(^\w{1})|(\s+\w{1})/g, (letter) => letter.toUpperCase())
            );

        const aux = el.createDiv({ cls: "suggestion-aux" });
        const iconElement = aux.createSpan({ cls: "suggestion-flair" });
        setIcon(iconElement, item.item);
    }

    public getItems(): string[] {
        return ICON_LIST;
    }

    public getItemText(item: string): string {
        return item;
    }

    public onChooseItem(item: string): void {
        if (this.command) {
            this.command.icon = item;
            if (this.onSyncCallback) {
                this.onSyncCallback();
            }
        }
    }
}
