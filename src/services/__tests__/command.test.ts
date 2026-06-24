import { describe, expect, it, vi } from "vitest";

vi.mock("@/data/stores/useSettingStore", () => ({
    useSettingStore: { getState: vi.fn() },
}));

import { SlashCommand } from "@/data/models/SlashCommand";
import SlashCommanderPlugin from "@/main";

import {
    findCommand,
    getDefaultCommands,
    getFlattenedCommands,
    getFlatValidCommands,
    hasPathVisibilityRules,
    isCommandActive,
    isCommandNameUniqueInItems,
    isCommandPathVisible,
    isDeviceValid,
    isIdUnique,
    validateCommandStructure,
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

interface PluginOptions {
    appId?: string;
    isMobile?: boolean;
    registeredActions?: string[];
}

function createPlugin(commands: SlashCommand[], options: PluginOptions = {}): SlashCommanderPlugin {
    const registeredActions =
        options.registeredActions ??
        commands
            .filter((command) => !command.isGroup && command.action)
            .map((command) => command.action!);
    const commandEntries = commands
        .filter((command) => !command.isGroup && command.action)
        .filter((command) => registeredActions.includes(command.action!))
        .map((command) => [
            command.action!,
            {
                id: command.action,
                name: command.name,
            },
        ]);

    return {
        app: {
            appId: options.appId ?? "desktop",
            commands: {
                commands: Object.fromEntries(commandEntries),
            },
            isMobile: options.isMobile ?? false,
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
            getFlatValidCommands(plugin, [group], { onNewLine: false }).map((command) => command.id)
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

describe("command availability", () => {
    it("filters inactive device modes and unregistered command actions", () => {
        const desktop = createCommand({
            id: "test:desktop",
            action: "test:desktop",
            mode: "desktop",
            name: "Desktop",
        });
        const mobile = createCommand({
            id: "test:mobile",
            action: "test:mobile",
            mode: "mobile",
            name: "Mobile",
        });
        const currentApp = createCommand({
            id: "test:current-app",
            action: "test:current-app",
            mode: "custom-app",
            name: "Current app",
        });
        const missingAction = createCommand({
            id: "test:missing-action",
            action: "test:missing-action",
            name: "Missing action",
        });
        const commands = [desktop, mobile, currentApp, missingAction];
        const plugin = createPlugin(commands, {
            appId: "custom-app",
            registeredActions: ["test:desktop", "test:mobile", "test:current-app"],
        });

        expect(getFlatValidCommands(plugin, commands).map((command) => command.id)).toEqual([
            "test:desktop",
            "test:current-app",
        ]);
    });

    it("evaluates command device modes against the current app context", () => {
        const desktopPlugin = createPlugin([], { appId: "desktop-app", isMobile: false });
        const mobilePlugin = createPlugin([], { appId: "mobile-app", isMobile: true });

        expect(isCommandActive(desktopPlugin, createCommand())).toBe(true);
        expect(isCommandActive(desktopPlugin, createCommand({ mode: "any" }))).toBe(true);
        expect(isCommandActive(desktopPlugin, createCommand({ mode: "desktop" }))).toBe(true);
        expect(isCommandActive(desktopPlugin, createCommand({ mode: "desktop-app" }))).toBe(true);
        expect(isCommandActive(desktopPlugin, createCommand({ mode: "mobile" }))).toBe(false);
        expect(isCommandActive(mobilePlugin, createCommand({ mode: "mobile" }))).toBe(true);
        expect(isCommandActive(mobilePlugin, createCommand({ mode: "desktop" }))).toBe(false);
    });

    it("accepts built-in device modes and the current app id", () => {
        const plugin = createPlugin([], { appId: "custom-app" });

        expect(isDeviceValid(plugin, "any")).toBe(true);
        expect(isDeviceValid(plugin, "desktop")).toBe(true);
        expect(isDeviceValid(plugin, "mobile")).toBe(true);
        expect(isDeviceValid(plugin, "custom-app")).toBe(true);
        expect(isDeviceValid(plugin, "other-app")).toBe(false);
    });
});

describe("command tree helpers", () => {
    it("flattens command groups while preserving parent-child order", () => {
        const first = createCommand({ id: "test:first", name: "First" });
        const child = createCommand({
            id: "test:child",
            action: "test:child",
            name: "Child",
            parentId: "test:group",
        });
        const group = createCommand({
            id: "test:group",
            action: undefined,
            children: [child],
            isGroup: true,
            name: "Group",
        });

        expect(getFlattenedCommands([first, group]).map((command) => command.id)).toEqual([
            "test:first",
            "test:group",
            "test:child",
        ]);
    });

    it("validates duplicate root and sibling child ids", () => {
        const root = createCommand({ id: "test:root" });
        const child = createCommand({ id: "test:child" });
        const group = createCommand({
            id: "test:group",
            action: undefined,
            children: [child],
            isGroup: true,
        });

        expect(() => validateCommandStructure([root, group])).not.toThrow();
        expect(() =>
            validateCommandStructure([
                createCommand({ id: "test:duplicate" }),
                createCommand({ id: "test:duplicate" }),
            ])
        ).toThrow("Duplicate root command ID: test:duplicate");
        expect(() =>
            validateCommandStructure([
                createCommand({
                    id: "test:group",
                    action: undefined,
                    children: [
                        createCommand({ id: "test:duplicate-child" }),
                        createCommand({ id: "test:duplicate-child" }),
                    ],
                    isGroup: true,
                }),
            ])
        ).toThrow("Duplicate child command ID: test:duplicate-child in parent test:group");
    });

    it("checks id uniqueness across roots and direct children", () => {
        const child = createCommand({ id: "test:child", parentId: "test:group" });
        const commands = [
            createCommand({ id: "test:root" }),
            createCommand({
                id: "test:group",
                action: undefined,
                children: [child],
                isGroup: true,
            }),
        ];

        expect(isIdUnique("test:root", commands)).toBe(false);
        expect(isIdUnique("test:child", commands)).toBe(false);
        expect(isIdUnique("test:new", commands)).toBe(true);
    });

    it("finds root commands and children within a parent context", () => {
        const root = createCommand({ id: "test:root" });
        const child = createCommand({ id: "test:child", parentId: "test:group" });
        const group = createCommand({
            id: "test:group",
            action: undefined,
            children: [child],
            isGroup: true,
        });
        const commands = [root, group];

        expect(findCommand(commands, "test:root")).toBe(root);
        expect(findCommand(commands, "test:child", "test:group")).toBe(child);
        expect(findCommand(commands, "test:child")).toBeUndefined();
        expect(findCommand(commands, "test:child", "test:missing-group")).toBeUndefined();
    });

    it("creates default commands as root-level commands without children", () => {
        const defaults = getDefaultCommands();

        expect(defaults.length).toBeGreaterThan(0);
        expect(
            defaults.every(
                (command) => command.parentId === undefined && command.children?.length === 0
            )
        ).toBe(true);
    });
});
