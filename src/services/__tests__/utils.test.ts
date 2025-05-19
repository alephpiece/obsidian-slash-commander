// Mock useSettingStore
const getStateMock = vi.fn();
vi.mock("@/data/stores/useSettingStore", () => ({
    useSettingStore: { getState: (...args: any[]) => getStateMock(...args) },
}));

import { beforeEach, describe, expect, it, vi } from "vitest";

import { SlashCommand } from "@/data/models/SlashCommand";
import SlashCommanderPlugin from "@/main";

import {
    getDeviceModeInfo,
    getTriggerModeInfo,
    isTriggeredAnywhere,
    isTriggerInConflicts,
} from "../utils";

// Mock i18next t
vi.mock("i18next", () => ({ t: (key: string) => key }));

describe("utils", () => {
    describe("isTriggerInConflicts", () => {
        let plugin: SlashCommanderPlugin;
        beforeEach(() => {
            plugin = {
                app: { internalPlugins: { plugins: { "slash-command": { enabled: true } } } },
            } as any;
        });

        it('should return true if mainTrigger is "/" and slash-command enabled', () => {
            getStateMock.mockReturnValue({
                settings: { mainTrigger: "/", extraTriggers: [], useExtraTriggers: false },
            });
            expect(isTriggerInConflicts(plugin)).toBe(true);
        });

        it('should return true if useExtraTriggers and extraTriggers includes "/"', () => {
            getStateMock.mockReturnValue({
                settings: { mainTrigger: "-", extraTriggers: ["/"], useExtraTriggers: true },
            });
            expect(isTriggerInConflicts(plugin)).toBe(true);
        });

        it("should return false if slash-command not enabled", () => {
            plugin.app.internalPlugins.plugins["slash-command"].enabled = false;
            getStateMock.mockReturnValue({
                settings: { mainTrigger: "/", extraTriggers: [], useExtraTriggers: false },
            });
            expect(isTriggerInConflicts(plugin)).toBe(false);
        });

        it("should return false if triggers do not conflict", () => {
            getStateMock.mockReturnValue({
                settings: { mainTrigger: "-", extraTriggers: ["!"], useExtraTriggers: true },
            });
            expect(isTriggerInConflicts(plugin)).toBe(false);
        });
    });

    describe("isTriggeredAnywhere", () => {
        it("should return true if triggerMode is undefined", () => {
            expect(isTriggeredAnywhere({} as SlashCommand)).toBe(true);
        });
        it('should return true if triggerMode is "anywhere"', () => {
            expect(isTriggeredAnywhere({ triggerMode: "anywhere" } as SlashCommand)).toBe(true);
        });
        it('should return false if triggerMode is not "anywhere"', () => {
            expect(isTriggeredAnywhere({ triggerMode: "inline" } as SlashCommand)).toBe(false);
        });
    });

    describe("getDeviceModeInfo", () => {
        it('should return correct info for "mobile"', () => {
            const info = getDeviceModeInfo("mobile");
            expect(info.deviceModeIcon).toBe("smartphone");
            expect(info.deviceModeName).toBe("bindings.device_mode.mobile");
        });
        it('should return correct info for "desktop"', () => {
            const info = getDeviceModeInfo("desktop");
            expect(info.deviceModeIcon).toBe("monitor");
            expect(info.deviceModeName).toBe("bindings.device_mode.desktop");
        });
        it('should return correct info for "any"', () => {
            const info = getDeviceModeInfo("any");
            expect(info.deviceModeIcon).toBe("cmdr-all-devices");
            expect(info.deviceModeName).toBe("bindings.device_mode.any");
        });
        it("should return fallback icon and name for unknown mode", () => {
            const info = getDeviceModeInfo("unknown");
            expect(info.deviceModeIcon).toBe("airplay");
            expect(info.deviceModeName).toBe("bindings.device_mode.this");
        });
    });

    describe("getTriggerModeInfo", () => {
        it('should return correct info for "newline"', () => {
            const info = getTriggerModeInfo("newline");
            expect(info.triggerModeIcon).toBe("cmdr-triggered-newline");
            expect(info.triggerModeName).toBe("bindings.trigger_mode.newline");
        });
        it('should return correct info for "inline"', () => {
            const info = getTriggerModeInfo("inline");
            expect(info.triggerModeIcon).toBe("cmdr-triggered-inline");
            expect(info.triggerModeName).toBe("bindings.trigger_mode.inline");
        });
        it('should return correct info for "anywhere"', () => {
            const info = getTriggerModeInfo("anywhere");
            expect(info.triggerModeIcon).toBe("regex");
            expect(info.triggerModeName).toBe("bindings.trigger_mode.anywhere");
        });
        it("should return fallback icon and name for unknown mode", () => {
            const info = getTriggerModeInfo("unknown");
            expect(info.triggerModeIcon).toBe("regex");
            expect(info.triggerModeName).toBe("bindings.trigger_mode.unknown");
        });
    });
});
