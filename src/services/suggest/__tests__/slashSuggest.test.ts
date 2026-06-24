import { beforeEach, describe, expect, it, vi } from "vitest";

const getFlatValidCommandsMock = vi.fn();

vi.mock("@/data/stores/useSettingStore", () => ({
    useSettingStore: {
        getState: () => ({
            getFlatValidCommands: getFlatValidCommandsMock,
            settings: {
                queryPattern: new RegExp("^(?<fullQuery>/(?<commandQuery>.*))", "d"),
                triggerOnlyOnNewLine: false,
            },
        }),
    },
}));

import { SlashCommand } from "@/data/models/SlashCommand";

import { SlashSuggester } from "../slashSuggest";

function createCommand(overrides: Partial<SlashCommand> = {}): SlashCommand {
    return {
        id: "test:command",
        action: "test:command",
        icon: "terminal",
        name: "Test command",
        ...overrides,
    };
}

function createPlugin() {
    return {
        app: {
            commands: {
                executeCommandById: vi.fn(),
            },
        },
    } as any;
}

describe("SlashSuggester", () => {
    beforeEach(() => {
        getFlatValidCommandsMock.mockReset();
    });

    it("detects inline slash queries and remembers the active file path", () => {
        const plugin = createPlugin();
        const suggester = new SlashSuggester(plugin);
        const editor = {
            getLine: () => "hello /open",
        };

        const trigger = suggester.onTrigger(
            { ch: 11, line: 0 },
            editor as any,
            { path: "Folder/Note.md" } as any
        );

        expect(trigger).toMatchObject({
            end: { ch: 11, line: 0 },
            query: "open",
            start: { ch: 6, line: 0 },
        });

        getFlatValidCommandsMock.mockReturnValue([createCommand()]);
        suggester.getSuggestions({
            ...trigger!,
            editor: editor as any,
            file: null,
        } as any);

        expect(getFlatValidCommandsMock).toHaveBeenCalledWith({
            filePath: "Folder/Note.md",
            onNewLine: false,
        });
    });

    it("returns null and clears file context when the trigger does not match", () => {
        const suggester = new SlashSuggester(createPlugin());
        const matchingEditor = {
            getLine: () => "hello /open",
        };
        const nonMatchingEditor = {
            getLine: () => "no trigger",
        };

        expect(
            suggester.onTrigger({ ch: 11, line: 0 }, matchingEditor as any, {
                path: "Folder/Note.md",
            } as any)
        ).not.toBeNull();
        expect(suggester.onTrigger({ ch: 10, line: 0 }, nonMatchingEditor as any, null)).toBeNull();

        getFlatValidCommandsMock.mockReturnValue([createCommand()]);
        suggester.getSuggestions({
            editor: nonMatchingEditor as any,
            end: { ch: 0, line: 0 },
            file: null,
            query: "",
            start: { ch: 0, line: 0 },
        } as any);

        expect(getFlatValidCommandsMock).toHaveBeenCalledWith({
            filePath: null,
            onNewLine: true,
        });
    });

    it("returns groups for empty queries and filters groups for fuzzy queries", () => {
        const group = createCommand({
            action: undefined,
            id: "test:group",
            isGroup: true,
            name: "Group",
        });
        const command = createCommand({ id: "test:open", name: "Open note" });
        const suggester = new SlashSuggester(createPlugin());

        getFlatValidCommandsMock.mockReturnValue([group, command]);

        expect(
            suggester
                .getSuggestions({
                    end: { ch: 1, line: 0 },
                    query: "",
                    start: { ch: 0, line: 0 },
                } as any)
                .map(({ item }) => item.id)
        ).toEqual(["test:group", "test:open"]);

        expect(
            suggester
                .getSuggestions({
                    end: { ch: 5, line: 0 },
                    query: "open",
                    start: { ch: 0, line: 0 },
                } as any)
                .map(({ item }) => item.id)
        ).toEqual(["test:open"]);
    });

    it("removes the trigger text and executes selected commands", () => {
        const plugin = createPlugin();
        const suggester = new SlashSuggester(plugin);
        const replaceRange = vi.fn();

        suggester.context = {
            editor: { replaceRange },
            end: { ch: 6, line: 0 },
            file: null,
            query: "open",
            start: { ch: 0, line: 0 },
        } as any;

        suggester.selectSuggestion({
            item: createCommand({ action: "test:open" }),
            match: null,
        } as any);

        expect(replaceRange).toHaveBeenCalledWith("", { ch: 0, line: 0 }, { ch: 6, line: 0 });
        expect(plugin.app.commands.executeCommandById).toHaveBeenCalledWith("test:open");
    });

    it("does not execute command groups", () => {
        const plugin = createPlugin();
        const suggester = new SlashSuggester(plugin);

        suggester.context = {
            editor: { replaceRange: vi.fn() },
            end: { ch: 6, line: 0 },
            file: null,
            query: "group",
            start: { ch: 0, line: 0 },
        } as any;

        suggester.selectSuggestion({
            item: createCommand({ action: undefined, isGroup: true }),
            match: null,
        } as any);

        expect(plugin.app.commands.executeCommandById).not.toHaveBeenCalled();
    });
});
