import { beforeEach, describe, expect, it, vi } from "vitest";

import { DEFAULT_SETTINGS } from "@/data/constants/defaultSettings";
import { SlashCommand } from "@/data/models/SlashCommand";

import { useSettingStore } from "../useSettingStore";

function createCommand(overrides: Partial<SlashCommand> = {}): SlashCommand {
    return {
        id: "test:command",
        action: "test:command",
        children: [],
        icon: "terminal",
        name: "Test command",
        ...overrides,
    };
}

function createPlugin(loadData: unknown = null) {
    return {
        app: {
            appId: "desktop",
            commands: {
                commands: {},
            },
            isMobile: false,
        },
        loadData: vi.fn().mockResolvedValue(loadData),
        saveData: vi.fn().mockResolvedValue(undefined),
    } as any;
}

function resetStore(bindings: SlashCommand[] = []): void {
    useSettingStore.setState({
        plugin: null,
        settings: {
            ...DEFAULT_SETTINGS,
            bindings,
            extraTriggers: [],
            queryPattern: DEFAULT_SETTINGS.queryPattern,
        },
    });
}

describe("useSettingStore", () => {
    beforeEach(() => {
        resetStore();
    });

    it("updates settings, rebuilds queryPattern, and saves", async () => {
        const plugin = createPlugin();
        const store = useSettingStore.getState();

        store.setPlugin(plugin);
        await useSettingStore.getState().updateSettings({
            extraTriggers: ["?"],
            mainTrigger: "!",
            useExtraTriggers: true,
        });

        const settings = useSettingStore.getState().settings;

        expect("!hello".match(settings.queryPattern)?.groups?.commandQuery).toBe("hello");
        expect("?hello".match(settings.queryPattern)?.groups?.commandQuery).toBe("hello");
        expect("/hello".match(settings.queryPattern)).toBeNull();
        expect(plugin.saveData).toHaveBeenCalledWith(settings);
    });

    it("loads settings through migration and rebuilds queryPattern", async () => {
        const plugin = createPlugin({
            mainTrigger: "!",
            useExtraTriggers: false,
            version: DEFAULT_SETTINGS.version,
        });

        useSettingStore.getState().setPlugin(plugin);
        await useSettingStore.getState().loadSettings();

        const settings = useSettingStore.getState().settings;

        expect(plugin.loadData).toHaveBeenCalledOnce();
        expect("!command".match(settings.queryPattern)?.groups?.commandQuery).toBe("command");
        expect("/command".match(settings.queryPattern)).toBeNull();
    });

    it("adds root commands and child commands", async () => {
        const group = createCommand({
            action: undefined,
            id: "test:group",
            isGroup: true,
            name: "Group",
        });
        const plugin = createPlugin();

        resetStore([group]);
        useSettingStore.getState().setPlugin(plugin);

        await useSettingStore.getState().addCommand(createCommand({ id: "test:root" }));
        await useSettingStore
            .getState()
            .addCommand(createCommand({ id: "test:child", parentId: "test:group" }));

        const commands = useSettingStore.getState().settings.bindings;

        expect(commands.map((command) => command.id)).toEqual(["test:group", "test:root"]);
        expect(commands[0].children?.map((command) => command.id)).toEqual(["test:child"]);
    });

    it("rejects duplicate root and child command ids", async () => {
        const group = createCommand({
            action: undefined,
            children: [createCommand({ id: "test:child", parentId: "test:group" })],
            id: "test:group",
            isGroup: true,
        });

        resetStore([group, createCommand({ id: "test:root" })]);

        await expect(
            useSettingStore.getState().addCommand(createCommand({ id: "test:root" }))
        ).rejects.toThrow("Root command with ID test:root already exists");
        await expect(
            useSettingStore
                .getState()
                .addCommand(createCommand({ id: "test:child", parentId: "test:group" }))
        ).rejects.toThrow("Child command with ID test:child already exists in parent test:group");
    });

    it("removes root and child commands", async () => {
        const root = createCommand({ id: "test:root" });
        const group = createCommand({
            action: undefined,
            children: [createCommand({ id: "test:child", parentId: "test:group" })],
            id: "test:group",
            isGroup: true,
        });

        resetStore([root, group]);

        await useSettingStore.getState().removeCommand("test:child", "test:group");
        await useSettingStore.getState().removeCommand("test:root");

        const commands = useSettingStore.getState().settings.bindings;

        expect(commands.map((command) => command.id)).toEqual(["test:group"]);
        expect(commands[0].children).toEqual([]);
    });

    it("moves commands between root and child positions", async () => {
        const root = createCommand({ id: "test:root" });
        const child = createCommand({ id: "test:child", parentId: "test:source" });
        const source = createCommand({
            action: undefined,
            children: [child],
            id: "test:source",
            isGroup: true,
        });
        const target = createCommand({
            action: undefined,
            id: "test:target",
            isGroup: true,
        });

        resetStore([root, source, target]);

        await useSettingStore.getState().moveCommand("test:root", undefined, "test:target");
        await useSettingStore.getState().moveCommand("test:child", "test:source", undefined);

        const commands = useSettingStore.getState().settings.bindings;
        const targetCommand = commands.find((command) => command.id === "test:target");

        expect(commands.map((command) => command.id)).toEqual([
            "test:source",
            "test:target",
            "test:child",
        ]);
        expect(targetCommand?.children?.map((command) => command.id)).toEqual(["test:root"]);
        expect(targetCommand?.children?.[0].parentId).toBe("test:target");
        expect(commands.find((command) => command.id === "test:child")?.parentId).toBeUndefined();
    });

    it("leaves commands unchanged when moving to a missing parent", async () => {
        const root = createCommand({ id: "test:root" });
        const target = createCommand({
            action: undefined,
            id: "test:target",
            isGroup: true,
        });

        resetStore([root, target]);

        await useSettingStore.getState().moveCommand("test:root", undefined, "test:missing");

        expect(useSettingStore.getState().settings.bindings).toEqual([root, target]);
    });

    it("leaves commands unchanged when source and target parent match", async () => {
        const child = createCommand({ id: "test:child", parentId: "test:parent" });
        const parent = createCommand({
            action: undefined,
            children: [child],
            id: "test:parent",
            isGroup: true,
        });

        resetStore([parent]);

        await useSettingStore.getState().moveCommand("test:child", "test:parent", "test:parent");

        expect(useSettingStore.getState().settings.bindings).toEqual([parent]);
    });

    it("restores normalized default commands", async () => {
        const plugin = createPlugin();

        resetStore([createCommand({ id: "test:custom" })]);
        useSettingStore.getState().setPlugin(plugin);

        await useSettingStore.getState().restoreDefault();

        const commands = useSettingStore.getState().settings.bindings;

        expect(commands.length).toBeGreaterThan(0);
        expect(commands.every((command) => command.parentId === undefined)).toBe(true);
        commands.forEach((command) => {
            expect(command.children).toEqual([]);
        });
        expect(plugin.saveData).toHaveBeenCalledWith(useSettingStore.getState().settings);
    });
});
