import { create } from "zustand";
import { SlashCommand, generateNewCommand } from "@/data/models/SlashCommand";
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
	updateCommands: (commands: SlashCommand[]) => Promise<void>;
	addCommand: (command: SlashCommand) => Promise<void>;
	removeCommand: (commandId: string) => Promise<void>;
	moveCommand: (commandId: string, targetParentId?: string) => Promise<void>;
	syncCommands: () => Promise<void>;
	restoreDefault: () => Promise<void>;

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
	updateCommands: async newCommands => {
		const { store } = get();
		if (store) {
			await store.updateStructure(newCommands);
		}
	},

	// Add a command
	addCommand: async command => {
		const { store } = get();
		if (store) {
			await store.addCommand(command);
		}
	},

	// Remove a command
	removeCommand: async commandId => {
		const { store } = get();
		if (store) {
			await store.removeCommand(commandId);
		}
	},

	// Move a command
	moveCommand: async (commandId, targetParentId) => {
		const { store } = get();
		if (store) {
			await store.moveCommand(commandId, targetParentId);
		}
	},

	// Restore default commands
	restoreDefault: async () => {
		const { store } = get();
		if (store) {
			await store.restoreDefault();
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
	useCommandStore(state => {
		if (state.store) {
			// Use the store's method to get child commands
			return state.store.getCommandChildren(parentId);
		}
		
		// Fallback if store is not available
		const findParentCommand = (commands: SlashCommand[]): SlashCommand | undefined => {
			for (const cmd of commands) {
				if (cmd.id === parentId) return cmd;
				if (cmd.children?.length) {
					const found = findParentCommand(cmd.children);
					if (found) return found;
				}
			}
			return undefined;
		};
		
		const parent = findParentCommand(state.commands);
		return parent?.children || [];
	});

/**
 * Helper function to add a new command
 */
export function addNewCommand(
	plugin: SlashCommanderPlugin,
	options: Partial<SlashCommand> = {}
): Promise<void> {
	const store = useCommandStore.getState();
	if (store.store) {
		return store.addCommand(generateNewCommand(options));
	}
	return Promise.resolve();
}

/**
 * Helper function to add a child command
 */
export function addChildCommand(
	plugin: SlashCommanderPlugin,
	parentId: string,
	options: Partial<SlashCommand> = {}
): Promise<void> {
	const store = useCommandStore.getState();
	if (!store.store) return Promise.resolve();
	
	const newCommand = generateNewCommand({
		...options,
		parentId
	});
	
	// Add the command first
	return store.addCommand(newCommand).then(() => {
		// Then move it under the parent
		return store.moveCommand(newCommand.id, parentId);
	});
}
