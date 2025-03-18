import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import SlashCommanderPlugin from "@/main";
import type { SlashCommand } from "@/data/models/SlashCommand";
import type { CommanderSettings } from "@/data/models/Settings";
import { DEFAULT_SETTINGS } from "@/data/constants/defaultSettings";
import * as CommandService from "@/services/command";

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
    
    // Command getters
    getCommands: () => SlashCommand[];
    getValidCommands: () => SlashCommand[];
    findCommand: (id: string, parentId?: string) => SlashCommand | undefined;
    
    // Command actions
    addCommand: (command: SlashCommand) => Promise<void>;
    removeCommand: (commandId: string, parentId?: string) => Promise<void>;
    moveCommand: (commandId: string, sourceParentId: string | undefined, targetParentId: string | undefined) => Promise<void>;
    
    // Command structure validation
    validateCommandStructure: (commands: SlashCommand[]) => void;
    restoreDefault: () => Promise<void>;
    isIdUnique: (id: string) => boolean;
    initialize: () => Promise<void>;
}

export const useSettingStore = create<SettingState>()(
    subscribeWithSelector(
        (set, get) => ({
            // Core state
            settings: { ...DEFAULT_SETTINGS },
            plugin: null,
            
            // Core initialization
            setPlugin: (plugin) => {
                set({ plugin });
            },
            
            // Settings actions
            updateSettings: async (partialSettings) => {
                set(state => ({
                    settings: {
                        ...state.settings,
                        ...partialSettings
                    }
                }));
                await get().saveSettings();
            },
            
            loadSettings: async () => {
                const { plugin } = get();
                if (!plugin) return;
                
                const loadedSettings = await plugin.loadData();
                const settings = loadedSettings
                    ? { ...DEFAULT_SETTINGS, ...loadedSettings }
                    : { ...DEFAULT_SETTINGS };
                
                set({ settings });
            },
            
            saveSettings: async () => {
                const { plugin, settings } = get();
                if (!plugin) return;
                
                await plugin.saveData(settings);
            },
            
            // Command getters
            getCommands: () => {
                return get().settings.bindings || [];
            },
            
            getValidCommands: () => {
                const { plugin } = get();
                if (!plugin) return [];
                return CommandService.getValidCommands(plugin, get().getCommands());
            },
            
            findCommand: (id, parentId) => {
                if (parentId) {
                    // Find within a specific parent
                    const parent = get().getCommands().find(cmd => cmd.id === parentId);
                    return parent?.children?.find(child => child.id === id);
                } else {
                    // Find at root level
                    return get().getCommands().find(cmd => cmd.id === id);
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
                    if (commands.some(cmd => cmd.id === command.id)) {
                        throw new Error(`Root command with ID ${command.id} already exists`);
                    }
                    commands.push(command);
                } else {
                    // Add as child command
                    const parent = commands.find(cmd => cmd.id === command.parentId);
                    if (parent) {
                        if (!parent.children) {
                            parent.children = [];
                        }
                        
                        if (parent.children.some(child => child.id === command.id)) {
                            throw new Error(`Child command with ID ${command.id} already exists in parent ${command.parentId}`);
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
                    const parent = commands.find(cmd => cmd.id === parentId);
                    if (parent?.children) {
                        parent.children = parent.children.filter(child => child.id !== commandId);
                    }
                } else {
                    // Remove root command and all its children
                    const filteredCommands = commands.filter(cmd => cmd.id !== commandId);
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
                    const sourceParent = commands.find(c => c.id === sourceParentId);
                    if (sourceParent?.children) {
                        const childIndex = sourceParent.children.findIndex(c => c.id === commandId);
                        if (childIndex !== -1) {
                            sourceCommand = { ...sourceParent.children[childIndex] };
                            sourceParent.children.splice(childIndex, 1);
                        }
                    }
                } else {
                    // From root level
                    const rootIndex = commands.findIndex(c => c.id === commandId);
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
                    const targetParent = commands.find(c => c.id === targetParentId);
                    if (targetParent) {
                        if (!targetParent.children) {
                            targetParent.children = [];
                        }
                        
                        // Check for duplicate ID
                        if (targetParent.children.some(child => child.id === commandId)) {
                            throw new Error(`Child command with ID ${commandId} already exists in target parent ${targetParentId}`);
                        }
                        
                        targetParent.children.push(sourceCommand);
                    }
                } else {
                    // Move to root level
                    if (commands.some(c => c.id === commandId)) {
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
            }
        })
    )
);

// Simplified hooks for specific use cases
export const useSettings = () => useSettingStore(state => state.settings);
export const useUpdateSettings = () => useSettingStore(state => state.updateSettings);
export const useCommands = () => useSettingStore(state => state.getCommands());
export const useValidCommands = () => useSettingStore(state => state.getValidCommands());
export const useFindCommand = () => useSettingStore(state => state.findCommand); 