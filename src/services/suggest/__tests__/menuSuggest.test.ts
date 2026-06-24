import { TextComponent } from "obsidian";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("i18next", () => ({ t: (key: string) => key }));

import type { SlashCommand } from "@/data/models/SlashCommand";
import { noticeMessages } from "@/test/mocks/obsidian";

import { MenuSuggestionModal } from "../suggester";

function createCommand(overrides: Partial<SlashCommand> = {}): SlashCommand {
    return {
        action: "plugin-one:open",
        icon: "terminal",
        id: "test:command",
        name: "Open note",
        ...overrides,
    };
}

function createPlugin() {
    return {
        app: {
            commands: {
                executeCommandById: vi.fn(),
            },
            keymap: {
                popScope: vi.fn(),
                pushScope: vi.fn(),
            },
        },
    } as any;
}

function createModal(commands: SlashCommand[]) {
    const input = new TextComponent(document.body);
    const plugin = createPlugin();
    return {
        input,
        modal: new MenuSuggestionModal(plugin, input, commands),
        plugin,
    };
}

function getRenderedItems(modal: MenuSuggestionModal): SlashCommand[] {
    return (modal as unknown as { currentRenderedItems: SlashCommand[] }).currentRenderedItems;
}

describe("MenuSuggestionModal", () => {
    beforeEach(() => {
        noticeMessages.length = 0;
    });

    afterEach(() => {
        document.body.replaceChildren();
    });

    it("returns command names as fuzzy-search text", () => {
        const { modal } = createModal([createCommand({ name: "Open current note" })]);

        expect(modal.getItemText(createCommand({ name: "Open current note" }))).toBe(
            "Open current note"
        );
    });

    it("tracks rendered items from the current suggestion result window", () => {
        const command = createCommand({ id: "test:open", name: "Open note" });
        const group = createCommand({
            action: undefined,
            id: "test:group",
            isGroup: true,
            name: "Open group",
        });
        const { modal } = createModal([command, group]);

        expect(modal.getSuggestions("open").map(({ item }) => item.id)).toEqual([
            "test:open",
            "test:group",
        ]);
        expect(getRenderedItems(modal).map((item) => item.id)).toEqual([
            "test:open",
            "test:group",
        ]);
    });

    it("executes selected commands and ignores groups", () => {
        const command = createCommand({ action: "plugin-one:open" });
        const group = createCommand({ action: undefined, isGroup: true });
        const { modal, plugin } = createModal([command, group]);

        modal.onChooseItem(command);
        modal.onChooseItem(group);

        expect(plugin.app.commands.executeCommandById).toHaveBeenCalledOnce();
        expect(plugin.app.commands.executeCommandById).toHaveBeenCalledWith("plugin-one:open");
    });

    it("shows an invalid-command notice for commands without actions", () => {
        const command = createCommand({ action: undefined, isGroup: false });
        const { modal, plugin } = createModal([command]);

        modal.onChooseItem(command);

        expect(plugin.app.commands.executeCommandById).not.toHaveBeenCalled();
        expect(noticeMessages).toEqual(["suggest.invalid_command"]);
    });

    it("closes the modal and removes the hidden input after selecting a suggestion", () => {
        const command = createCommand();
        const { input, modal, plugin } = createModal([command]);

        modal.selectSuggestion({ item: command, match: null } as any);

        expect(plugin.app.commands.executeCommandById).toHaveBeenCalledWith("plugin-one:open");
        expect(plugin.app.keymap.popScope).toHaveBeenCalledOnce();
        expect(input.inputEl.isConnected).toBe(false);
    });
});
