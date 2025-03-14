import { create } from 'zustand';
import { SlashCommand } from '@/data/models/SlashCommand';
import SlashCommanderPlugin from '@/main';
import CommandStore from './CommandStore';

/**
 * Zustand store for managing commands and related operations
 */
interface CommandState {
  // State
  commands: SlashCommand[];
  plugin: SlashCommanderPlugin | null;
  store: CommandStore | null;

  // Actions
  setPlugin: (plugin: SlashCommanderPlugin) => void;
  setStore: (store: CommandStore) => () => void;
  updateCommands: (commands: SlashCommand[]) => void;
  syncCommands: () => Promise<void>;
  
  // Initialize store with data from CommandStore
  initialize: () => void;
}

export const useCommandStore = create<CommandState>((set, get) => ({
  // Initial state
  commands: [],
  plugin: null,
  store: null,
  
  // Set plugin reference
  setPlugin: (plugin) => set({ plugin }),
  
  // Set CommandStore reference
  setStore: (store) => {
    set({ store });
    
    // Subscribe to CommandStore changes
    const unsubscribe = store.on('changed', (newCommands: SlashCommand[]) => {
      set({ commands: [...newCommands] });
    });
    
    // Return cleanup function
    return unsubscribe;
  },
  
  // Update commands in state and CommandStore
  updateCommands: (newCommands) => {
    const { store } = get();
    if (store) {
      store.updateStructure(newCommands);
      // Note: don't need to update state here since the 'changed' event will trigger an update
    }
  },
  
  // Sync commands with CommandStore and save settings
  syncCommands: async () => {
    const { store, plugin } = get();
    if (store && plugin) {
      await store.commitChanges();
      await plugin.saveSettings();
    }
  },
  
  // Initialize store with data from CommandStore
  initialize: () => {
    const { store } = get();
    if (store) {
      set({ commands: store.getAllCommands() });
    }
  },
})); 