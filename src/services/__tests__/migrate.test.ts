import { beforeEach, describe, expect, it, vi } from "vitest";

const { generateUniqueIdMock } = vi.hoisted(() => ({
    generateUniqueIdMock: vi.fn(),
}));

vi.mock("../command", () => ({
    generateUniqueId: (...args: unknown[]) => generateUniqueIdMock(...args),
}));

import { DEFAULT_SETTINGS } from "@/data/constants/defaultSettings";
import { DATA_VERSION } from "@/data/constants/version";
import { SlashCommand } from "@/data/models/SlashCommand";
import { noticeMessages } from "@/test/mocks/obsidian";

import { ensureAllFieldsPresent, migrateDataToV2, migrateSettings } from "../migrate";

function createLegacyCommand(overrides: Partial<SlashCommand> = {}): SlashCommand {
    return {
        id: "legacy:command",
        icon: "terminal",
        name: "Legacy command",
        ...overrides,
    } as SlashCommand;
}

describe("ensureAllFieldsPresent", () => {
    it("fills missing fields with defaults", () => {
        const settings = ensureAllFieldsPresent({});

        expect(settings.version).toBe(DATA_VERSION);
        expect(settings.confirmDeletion).toBe(DEFAULT_SETTINGS.confirmDeletion);
        expect(settings.showDescriptions).toBe(DEFAULT_SETTINGS.showDescriptions);
        expect(settings.showSourcesForDuplicates).toBe(DEFAULT_SETTINGS.showSourcesForDuplicates);
        expect(settings.mainTrigger).toBe(DEFAULT_SETTINGS.mainTrigger);
        expect(settings.extraTriggers).toEqual(DEFAULT_SETTINGS.extraTriggers);
        expect(settings.bindings).toEqual(DEFAULT_SETTINGS.bindings);
        expect(settings.bindings).not.toBe(DEFAULT_SETTINGS.bindings);
        expect(settings.bindings[0]).not.toBe(DEFAULT_SETTINGS.bindings[0]);
    });

    it("preserves existing user values", () => {
        const bindings = [createLegacyCommand({ id: "custom:command" })];
        const settings = ensureAllFieldsPresent({
            version: DATA_VERSION,
            confirmDeletion: false,
            showDescriptions: true,
            showSourcesForDuplicates: false,
            debug: true,
            mainTrigger: "!",
            extraTriggers: ["#", "?"],
            useExtraTriggers: true,
            triggerOnlyOnNewLine: true,
            bindings,
        });

        expect(settings.confirmDeletion).toBe(false);
        expect(settings.showDescriptions).toBe(true);
        expect(settings.showSourcesForDuplicates).toBe(false);
        expect(settings.debug).toBe(true);
        expect(settings.mainTrigger).toBe("!");
        expect(settings.extraTriggers).toEqual(["#", "?"]);
        expect(settings.useExtraTriggers).toBe(true);
        expect(settings.triggerOnlyOnNewLine).toBe(true);
        expect(settings.bindings).toBe(bindings);
    });

    it("uses defaults when array fields have invalid shapes", () => {
        const settings = ensureAllFieldsPresent({
            extraTriggers: "not-an-array",
            bindings: "not-an-array",
        });

        expect(settings.extraTriggers).toEqual(DEFAULT_SETTINGS.extraTriggers);
        expect(settings.bindings).toEqual(DEFAULT_SETTINGS.bindings);
        expect(settings.bindings).not.toBe(DEFAULT_SETTINGS.bindings);
        expect(settings.bindings[0]).not.toBe(DEFAULT_SETTINGS.bindings[0]);
    });
});

describe("migrateSettings", () => {
    beforeEach(() => {
        generateUniqueIdMock.mockReset();
        noticeMessages.length = 0;
    });

    it("normalizes current-version data without saving", async () => {
        const saveCallback = vi.fn();
        const settings = await migrateSettings(
            {
                version: DATA_VERSION,
                mainTrigger: "!",
            },
            saveCallback
        );

        expect(settings.version).toBe(DATA_VERSION);
        expect(settings.mainTrigger).toBe("!");
        expect(settings.bindings).toEqual(DEFAULT_SETTINGS.bindings);
        expect(settings.bindings).not.toBe(DEFAULT_SETTINGS.bindings);
        expect(settings.bindings[0]).not.toBe(DEFAULT_SETTINGS.bindings[0]);
        expect(saveCallback).not.toHaveBeenCalled();
        expect(noticeMessages).toEqual([]);
    });

    it("migrates old data to the current version and saves it", async () => {
        const saveCallback = vi.fn();
        const legacyBinding = createLegacyCommand({
            id: "legacy:root",
            children: [createLegacyCommand({ id: "legacy:child" })],
        });

        const settings = await migrateSettings(
            {
                version: 1,
                bindings: [legacyBinding],
            },
            saveCallback
        );

        expect(settings.version).toBe(DATA_VERSION);
        expect(settings.bindings[0].action).toBe("legacy:root");
        expect(settings.bindings[0].isGroup).toBe(true);
        expect(settings.bindings[0].children?.[0].action).toBe("legacy:child");
        expect(settings.bindings[0].children?.[0].isGroup).toBe(false);
        expect(saveCallback).toHaveBeenCalledOnce();
        expect(saveCallback).toHaveBeenCalledWith(settings);
        expect(noticeMessages.length).toBeGreaterThan(0);
    });
});

describe("migrateDataToV2", () => {
    beforeEach(() => {
        generateUniqueIdMock.mockReset();
    });

    it("fills missing action and isGroup fields", async () => {
        const migrated = await migrateDataToV2({
            bindings: [
                createLegacyCommand({
                    id: "legacy:group",
                    children: [createLegacyCommand({ id: "legacy:child" })],
                }),
            ],
        });

        expect(migrated.bindings[0]).toMatchObject({
            id: "legacy:group",
            action: "legacy:group",
            isGroup: true,
        });
        expect(migrated.bindings[0].children[0]).toMatchObject({
            id: "legacy:child",
            action: "legacy:child",
            isGroup: false,
        });
    });

    it("regenerates duplicate command ids without reusing existing ids", async () => {
        generateUniqueIdMock
            .mockReturnValueOnce("legacy:duplicate")
            .mockReturnValueOnce("generated:root")
            .mockReturnValueOnce("generated:child");

        const migrated = await migrateDataToV2({
            bindings: [
                createLegacyCommand({ id: "legacy:duplicate" }),
                createLegacyCommand({
                    id: "legacy:group",
                    children: [createLegacyCommand({ id: "legacy:duplicate" })],
                }),
            ],
        });

        expect(migrated.bindings[0].id).toBe("generated:root");
        expect(migrated.bindings[1].children[0].id).toBe("generated:child");
        expect(migrated.bindings[0].action).toBe("legacy:duplicate");
        expect(migrated.bindings[1].children[0].action).toBe("legacy:duplicate");
    });
});
