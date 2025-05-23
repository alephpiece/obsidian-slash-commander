import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

import { DEFAULT_SETTINGS } from "@/data/constants/defaultSettings";
import type { CommanderSettings } from "@/data/models/Settings";
import type { SlashCommand } from "@/data/models/SlashCommand";
import SlashCommanderPlugin from "@/main";
import * as CommandService from "@/services/command";
import { migrateSettings } from "@/services/migrate";
import { buildQueryPattern } from "@/services/search";

interface SettingState {
    // Core state
    settings: CommanderSettings;
    plugin: SlashCommanderPlugin | null;

    // Core initialization
    setPlugin: (plugin: SlashCommanderPlugin) => void;

    // Settings actions
    updateSettings: (settings: Partial<CommanderSettings>) => Promise<void>;
    loadSettings: () => Promise<void>;
    saveSettings: () => Promise<void>;
    updateCommand: (commandId: string, updates: Partial<SlashCommand>) => Promise<boolean>;

    // Command getters
    getCommands: () => SlashCommand[];
    getFlattenedCommands: () => SlashCommand[];
    getFlatValidCommands: () => SlashCommand[];
    findCommand: (id: string, parentId?: string) => SlashCommand | undefined;

    // Command actions
    addCommand: (command: SlashCommand) => Promise<void>;
    removeCommand: (commandId: string, parentId?: string) => Promise<void>;
    moveCommand: (
        commandId: string,
        sourceParentId: string | undefined,
        targetParentId: string | undefined
    ) => Promise<void>;

    // Command structure validation
    validateCommandStructure: (commands: SlashCommand[]) => void;
    restoreDefault: () => Promise<void>;
    isIdUnique: (id: string) => boolean;
    initialize: () => Promise<void>;
}

export const useSettingStore = create<SettingState>()(
    subscribeWithSelector((set, get) => ({
        // Core state
        settings: { ...DEFAULT_SETTINGS },
        plugin: null,

        // Core initialization
        setPlugin: (plugin) => {
            set({ plugin });
        },

        // Settings actions
        updateSettings: async (partialSettings) => {
            const newSettings = {
                ...get().settings,
                ...partialSettings,
            };

            if (
                partialSettings.mainTrigger !== undefined ||
                partialSettings.extraTriggers !== undefined ||
                partialSettings.useExtraTriggers !== undefined ||
                partialSettings.triggerOnlyOnNewLine !== undefined
            ) {
                newSettings.queryPattern = buildQueryPattern(
                    newSettings.mainTrigger,
                    newSettings.extraTriggers,
                    newSettings.useExtraTriggers
                );
            }

            set({ settings: newSettings });
            await get().saveSettings();
        },

        updateCommand: async (commandId: string, updates: Partial<SlashCommand>) => {
            const commands = [...get().getCommands()];
            let updated = false;

            const updateCommandInTree = (cmds: SlashCommand[]): boolean => {
                for (let i = 0; i < cmds.length; i++) {
                    if (cmds[i].id === commandId) {
                        cmds[i] = { ...cmds[i], ...updates };
                        return true;
                    }

                    if (cmds[i].children?.length) {
                        if (updateCommandInTree(cmds[i].children || [])) {
                            return true;
                        }
                    }
                }
                return false;
            };

            updated = updateCommandInTree(commands);

            if (updated) {
                await get().updateSettings({ bindings: commands });
            }

            return updated;
        },

        loadSettings: async () => {
            const { plugin } = get();
            if (!plugin) return;

            const loadedData = await plugin.loadData();

            // Use migration function to handle all configuration updates
            // This ensures user data is never overwritten unnecessarily
            const settings = await migrateSettings(loadedData, async (updatedSettings) => {
                await plugin.saveData(updatedSettings);
            });

            // Rebuild query pattern since RegExp objects can't be serialized
            settings.queryPattern = buildQueryPattern(
                settings.mainTrigger,
                settings.extraTriggers,
                settings.useExtraTriggers
            );

            set({ settings });
        },

        saveSettings: async () => {
            const { plugin, settings } = get();
            if (!plugin) return;

            await plugin.saveData(settings);
        },

        getCommands: () => {
            return get().settings.bindings || [];
        },

        getFlattenedCommands: () => {
            return CommandService.getFlattenedCommands(get().getCommands());
        },

        getFlatValidCommands: () => {
            const { plugin } = get();
            if (!plugin) return [];
            return CommandService.getFlatValidCommands(plugin, get().getCommands());
        },

        findCommand: (id, parentId) => {
            if (parentId) {
                // Find within a specific parent
                const parent = get()
                    .getCommands()
                    .find((cmd) => cmd.id === parentId);
                return parent?.children?.find((child) => child.id === id);
            } else {
                // Find at root level
                return get()
                    .getCommands()
                    .find((cmd) => cmd.id === id);
            }
        },

        // Command actions
        addCommand: async (command) => {
            const commands = [...get().getCommands()];

            if (!command.children) {
                command.children = [];
            }

            if (!command.parentId) {
                // Add as root command
                if (commands.some((cmd) => cmd.id === command.id)) {
                    throw new Error(`Root command with ID ${command.id} already exists`);
                }
                commands.push(command);
            } else {
                // Add as child command
                const parent = commands.find((cmd) => cmd.id === command.parentId);
                if (parent) {
                    if (!parent.children) {
                        parent.children = [];
                    }

                    if (parent.children.some((child) => child.id === command.id)) {
                        throw new Error(
                            `Child command with ID ${command.id} already exists in parent ${command.parentId}`
                        );
                    }

                    parent.children.push(command);
                }
            }

            await get().updateSettings({ bindings: commands });
        },

        removeCommand: async (commandId, parentId) => {
            const commands = [...get().getCommands()];

            if (parentId) {
                // Remove child command
                const parent = commands.find((cmd) => cmd.id === parentId);
                if (parent?.children) {
                    parent.children = parent.children.filter((child) => child.id !== commandId);
                }
            } else {
                // Remove root command and all its children
                const filteredCommands = commands.filter((cmd) => cmd.id !== commandId);
                await get().updateSettings({ bindings: filteredCommands });
                return;
            }

            await get().updateSettings({ bindings: commands });
        },

        moveCommand: async (commandId, sourceParentId, targetParentId) => {
            const commands = [...get().getCommands()];
            let sourceCommand: SlashCommand | undefined;

            // Find and remove source command
            if (sourceParentId) {
                // From parent command
                const sourceParent = commands.find((c) => c.id === sourceParentId);
                if (sourceParent?.children) {
                    const childIndex = sourceParent.children.findIndex((c) => c.id === commandId);
                    if (childIndex !== -1) {
                        sourceCommand = { ...sourceParent.children[childIndex] };
                        sourceParent.children.splice(childIndex, 1);
                    }
                }
            } else {
                // From root level
                const rootIndex = commands.findIndex((c) => c.id === commandId);
                if (rootIndex !== -1) {
                    sourceCommand = { ...commands[rootIndex] };
                    commands.splice(rootIndex, 1);
                }
            }

            if (!sourceCommand) return;

            // Update parentId
            sourceCommand.parentId = targetParentId;

            // Add to target location
            if (targetParentId) {
                // Move to parent command
                const targetParent = commands.find((c) => c.id === targetParentId);
                if (targetParent) {
                    if (!targetParent.children) {
                        targetParent.children = [];
                    }

                    // Check for duplicate ID
                    if (targetParent.children.some((child) => child.id === commandId)) {
                        throw new Error(
                            `Child command with ID ${commandId} already exists in target parent ${targetParentId}`
                        );
                    }

                    targetParent.children.push(sourceCommand);
                }
            } else {
                // Move to root level
                if (commands.some((c) => c.id === commandId)) {
                    throw new Error(`Root command with ID ${commandId} already exists`);
                }
                commands.push(sourceCommand);
            }

            await get().updateSettings({ bindings: commands });
        },

        validateCommandStructure: (commands) => {
            CommandService.validateCommandStructure(commands);
        },

        restoreDefault: async () => {
            const defaultCommands = CommandService.getDefaultCommands();
            await get().updateSettings({ bindings: defaultCommands });
        },

        isIdUnique: (id) => {
            return CommandService.isIdUnique(id, get().getCommands());
        },

        initialize: async () => {
            await get().loadSettings();
        },
    }))
);

// Simplified hooks for specific use cases
export const useSettings = () => useSettingStore((state) => state.settings);
export const useUpdateSettings = () => useSettingStore((state) => state.updateSettings);
export const useCommands = () => useSettingStore((state) => state.getCommands());
export const useFlattenedCommands = () => useSettingStore((state) => state.getFlattenedCommands());
export const useFlatValidCommands = () => useSettingStore((state) => state.getFlatValidCommands());
export const useFindCommand = () => useSettingStore((state) => state.findCommand);
