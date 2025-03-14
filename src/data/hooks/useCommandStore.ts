import { create } from "zustand";
import { SlashCommand } from "@/data/models/SlashCommand";
import SlashCommanderPlugin from "@/main";
import CommandStore from "@/data/stores/CommandStore";

/**
 * Interface for the command state in Zustand store
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

/**
 * Zustand store for managing UI state related to commands
 *
 * This hook provides:
 * 1. Access to command data for UI components
 * 2. Methods to update command data in the underlying CommandStore
 * 3. Synchronization between UI state and persistent storage
 */
export const useCommandStore = create<CommandState>((set, get) => ({
	// Initial state
	commands: [],
	plugin: null,
	store: null,

	// Set plugin reference
	setPlugin: plugin => set({ plugin }),

	// Set CommandStore reference and subscribe to changes
	setStore: store => {
		set({ store });

		// Subscribe to CommandStore changes
		const unsubscribe = store.on("changed", (newCommands: SlashCommand[]) => {
			set({ commands: [...newCommands] });
		});

		// Return cleanup function
		return unsubscribe;
	},

	// Update commands in CommandStore
	updateCommands: newCommands => {
		const { store } = get();
		if (store) {
			store.updateStructure(newCommands);
			// State updates automatically via 'changed' event
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

/**
 * Hook to access all commands
 */
export const useCommands = () => useCommandStore(state => state.commands);

/**
 * Hook to access the plugin instance
 */
export const usePlugin = () => useCommandStore(state => state.plugin);

/**
 * Hook to access the CommandStore instance
 */
export const useStore = () => useCommandStore(state => state.store);

/**
 * Hook to access child commands of a specific parent
 */
export const useChildCommands = (parentId: string) =>
	useCommandStore(state => state.commands.filter(cmd => cmd.parentId === parentId));
