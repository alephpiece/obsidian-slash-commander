import { describe, expect, it, vi } from "vitest";

vi.mock("@/data/stores/useSettingStore", () => ({
    useSettingStore: { getState: vi.fn() },
}));

import { SlashCommand } from "@/data/models/SlashCommand";
import SlashCommanderPlugin from "@/main";

import {
    getFlatValidCommands,
    hasPathVisibilityRules,
    isCommandNameUniqueInItems,
    isCommandPathVisible,
} from "../command";

function createCommand(overrides: Partial<SlashCommand> = {}): SlashCommand {
    return {
        id: "test:command",
        action: "test:command",
        icon: "terminal",
        name: "Test command",
        ...overrides,
    };
}

function createPlugin(commands: SlashCommand[]): SlashCommanderPlugin {
    const commandEntries = commands
        .filter((command) => !command.isGroup && command.action)
        .map((command) => [
            command.action!,
            {
                id: command.action,
                name: command.name,
            },
        ]);

    return {
        app: {
            appId: "desktop",
            commands: {
                commands: Object.fromEntries(commandEntries),
            },
            isMobile: false,
        },
    } as SlashCommanderPlugin;
}

describe("command visibility", () => {
    it("shows commands without path rules", () => {
        const command = createCommand();

        expect(isCommandPathVisible(command)).toBe(true);
        expect(hasPathVisibilityRules(command)).toBe(false);
    });

    it("shows commands when include paths match", () => {
        const command = createCommand({
            visibility: {
                pathPatterns: {
                    include: ["Projects/**"],
                },
            },
        });

        expect(isCommandPathVisible(command, { filePath: "Projects/Alpha.md" })).toBe(true);
        expect(hasPathVisibilityRules(command)).toBe(true);
    });

    it("hides commands when include paths do not match", () => {
        const command = createCommand({
            visibility: {
                pathPatterns: {
                    include: ["Projects/**"],
                },
            },
        });

        expect(isCommandPathVisible(command, { filePath: "People/Ada.md" })).toBe(false);
    });

    it("hides commands when exclude paths match", () => {
        const command = createCommand({
            visibility: {
                pathPatterns: {
                    exclude: ["Projects/Archive/**"],
                    include: ["Projects/**"],
                },
            },
        });

        expect(isCommandPathVisible(command, { filePath: "Projects/Archive/Old.md" })).toBe(false);
    });

    it("hides path-conditioned commands when no file path is available", () => {
        const command = createCommand({
            visibility: {
                pathPatterns: {
                    include: ["Projects/**"],
                },
            },
        });

        expect(isCommandPathVisible(command)).toBe(false);
    });

    it("normalizes Windows-style paths and patterns", () => {
        const command = createCommand({
            visibility: {
                pathPatterns: {
                    include: ["Projects\\**"],
                },
            },
        });

        expect(isCommandPathVisible(command, { filePath: "Projects\\Alpha.md" })).toBe(true);
    });

    it("hides children when parent group path visibility does not match", () => {
        const child = createCommand({
            id: "test:child",
            action: "test:child",
            name: "Child command",
        });
        const group = createCommand({
            id: "test:group",
            action: undefined,
            children: [child],
            isGroup: true,
            name: "Group",
            visibility: {
                pathPatterns: {
                    include: ["Projects/**"],
                },
            },
        });
        const plugin = createPlugin([child]);

        expect(
            getFlatValidCommands(plugin, [group], { filePath: "People/Ada.md" }).map(
                (command) => command.id
            )
        ).toEqual([]);
        expect(
            getFlatValidCommands(plugin, [group], { filePath: "Projects/Alpha.md" }).map(
                (command) => command.id
            )
        ).toEqual(["test:group", "test:child"]);
    });

    it("hides groups when all children are hidden by child path visibility", () => {
        const child = createCommand({
            id: "test:child",
            action: "test:child",
            name: "Child command",
            visibility: {
                pathPatterns: {
                    include: ["Projects/**"],
                },
            },
        });
        const group = createCommand({
            id: "test:group",
            action: undefined,
            children: [child],
            isGroup: true,
            name: "Group",
        });
        const plugin = createPlugin([child]);

        expect(
            getFlatValidCommands(plugin, [group], { filePath: "People/Ada.md" }).map(
                (command) => command.id
            )
        ).toEqual([]);
    });

    it("hides groups when all children are hidden by trigger mode", () => {
        const child = createCommand({
            id: "test:child",
            action: "test:child",
            name: "Child command",
            triggerMode: "newline",
        });
        const group = createCommand({
            id: "test:group",
            action: undefined,
            children: [child],
            isGroup: true,
            name: "Group",
        });
        const plugin = createPlugin([child]);

        expect(
            getFlatValidCommands(plugin, [group], { onNewLine: false }).map(
                (command) => command.id
            )
        ).toEqual([]);
    });

    it("filters commands by trigger mode in the shared visibility pipeline", () => {
        const inline = createCommand({
            id: "test:inline",
            action: "test:inline",
            name: "Inline",
            triggerMode: "inline",
        });
        const newline = createCommand({
            id: "test:newline",
            action: "test:newline",
            name: "Newline",
            triggerMode: "newline",
        });
        const anywhere = createCommand({
            id: "test:anywhere",
            action: "test:anywhere",
            name: "Anywhere",
            triggerMode: "anywhere",
        });
        const commands = [inline, newline, anywhere];
        const plugin = createPlugin(commands);

        expect(
            getFlatValidCommands(plugin, commands, { onNewLine: true }).map((command) => command.id)
        ).toEqual(["test:newline", "test:anywhere"]);
        expect(
            getFlatValidCommands(plugin, commands, { onNewLine: false }).map(
                (command) => command.id
            )
        ).toEqual(["test:inline", "test:anywhere"]);
    });

    it("checks command name uniqueness within current visible items", () => {
        const first = createCommand({
            id: "test:first",
            name: "Duplicate",
        });
        const second = createCommand({
            id: "test:second",
            name: "Duplicate",
        });
        const other = createCommand({
            id: "test:other",
            name: "Other",
        });

        expect(isCommandNameUniqueInItems(first, [first, other])).toBe(true);
        expect(isCommandNameUniqueInItems(first, [first, second, other])).toBe(false);
    });
});
