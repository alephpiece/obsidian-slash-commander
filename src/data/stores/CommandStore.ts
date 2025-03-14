import { DEFAULT_SETTINGS } from "@/data/constants/defaultSettings";
import SlashCommanderPlugin from "@/main";
import {
	SlashCommand,
	isCommandActive,
	isValidSuggestItem,
	getChildCommands,
} from "@/data/models/SlashCommand";

// Simple EventEmitter implementation
type EventCallback<T = any> = (data: T) => void;

class EventEmitter {
	private events: Record<string, EventCallback[]> = {};

	public on<T>(event: string, callback: EventCallback<T>): () => void {
		if (!this.events[event]) {
			this.events[event] = [];
		}
		this.events[event].push(callback);

		// Return unsubscribe function
		return () => this.off(event, callback);
	}

	public off(event: string, callback: EventCallback): void {
		if (!this.events[event]) return;
		this.events[event] = this.events[event].filter(cb => cb !== callback);
	}

	public emit<T>(event: string, data: T): void {
		if (!this.events[event]) return;
		this.events[event].forEach(callback => callback(data));
	}
}

export default class CommandStore extends EventEmitter {
	// Primary storage: ordered array of commands
	private commands: SlashCommand[] = [];

	// Command index map for fast lookup by ID
	private commandIndex: Map<string, SlashCommand> = new Map();

	// Set of IDs for active commands that are registered with Obsidian
	private registeredCommands: Set<string> = new Set();

	protected plugin: SlashCommanderPlugin;

	public constructor(plugin: SlashCommanderPlugin) {
		super();
		this.plugin = plugin;
		this.initializeFromSettings();
	}

	// Build the tree structure from flat commands array
	private buildTreeStructure(): void {
		// Clear existing children arrays
		this.commands.forEach(cmd => {
			cmd.children = [];
		});

		// Build parent-child relationships
		this.commands.forEach(cmd => {
			if (cmd.parentId) {
				const parent = this.commandIndex.get(cmd.parentId);
				if (parent) {
					if (!parent.children) {
						parent.children = [];
					}
					parent.children.push(cmd);
				}
			}
		});
	}

	// Rebuild the index mapping completely
	private rebuildCommandIndex(): void {
		this.commandIndex.clear();
		this.commands.forEach(cmd => {
			this.commandIndex.set(cmd.id, cmd);
		});

		// Build tree structure after updating index
		this.buildTreeStructure();
	}

	// Get command by ID using the index map
	private getCommandById(id: string): SlashCommand | undefined {
		return this.commandIndex.get(id);
	}

	private initializeFromSettings(): void {
		const bindings = this.plugin.settingsStore.getSettings().bindings;

		// Initialize commands array
		this.commands = [...bindings];

		// Build the index and tree structure
		this.rebuildCommandIndex();

		// Initialize registered commands
		this.updateActiveCommands();
	}

	// Update which commands should be active based on current state
	private updateActiveCommands(): void {
		// Get currently active command IDs
		const shouldBeActive = new Set(
			this.getAllCommands()
				.filter(cmd => isCommandActive(this.plugin, cmd))
				.map(cmd => cmd.id)
		);

		// Find commands to register
		const toRegister = new Set(
			[...shouldBeActive].filter(id => !this.registeredCommands.has(id))
		);

		// Find commands to unregister
		const toUnregister = new Set(
			[...this.registeredCommands].filter(id => !shouldBeActive.has(id))
		);

		// Register new commands
		for (const id of toRegister) {
			this.plugin.register(() => this.removeCommand(id, false));
			this.registeredCommands.add(id);
		}

		// Update tracking of registered commands
		for (const id of toUnregister) {
			this.registeredCommands.delete(id);
		}
	}

	private async saveToSettings(): Promise<void> {
		const commands = this.getAllCommands();
		await this.plugin.settingsStore.updateSettings({
			bindings: commands,
		});
	}

	public async commitChanges(): Promise<void> {
		this.updateActiveCommands();
		await this.saveToSettings();
		this.emit("changed", this.getAllCommands());
	}

	public getAllCommands(): SlashCommand[] {
		return [...this.commands];
	}

	public getRootCommands(): SlashCommand[] {
		return this.getAllCommands().filter(cmd => !cmd.parentId);
	}

	public getCommandChildren(parentId: string): SlashCommand[] {
		const parent = this.getCommandById(parentId);
		return parent?.children || [];
	}

	public getValidCommands(): SlashCommand[] {
		// Filter and clone root commands
		const validRootCommands = this.getRootCommands()
			.filter(cmd => isValidSuggestItem(this.plugin, cmd))
			.map(cmd => ({ ...cmd }));

		// Process and filter children for command groups
		validRootCommands.forEach(cmd => {
			if (cmd.children && cmd.children.length > 0) {
				const validChildren = cmd.children
					.filter(child => isValidSuggestItem(this.plugin, child))
					.map(child => ({ ...child }));

				cmd.children = validChildren;
			}
		});

		return validRootCommands;
	}

	public async addCommand(scmd: SlashCommand, newlyAdded = true): Promise<void> {
		if (!scmd.children) {
			scmd.children = [];
		}

		// Add to the array
		this.commands.push(scmd);

		// Update index and tree structure
		this.commandIndex.set(scmd.id, scmd);

		// If this command has a parent, add it to parent's children
		if (scmd.parentId) {
			const parent = this.getCommandById(scmd.parentId);
			if (parent) {
				if (!parent.children) {
					parent.children = [];
				}
				parent.children.push(scmd);
			}
		}

		if (newlyAdded) {
			await this.commitChanges();
		}
	}

	public async removeCommand(commandId: string, save = true): Promise<void> {
		const command = this.getCommandById(commandId);
		if (!command) return;

		// Recursively remove child commands
		if (command.children) {
			for (const child of [...command.children]) {
				await this.removeCommand(child.id, false);
			}
		}

		// Remove from parent's children array if it has a parent
		if (command.parentId) {
			const parent = this.getCommandById(command.parentId);
			if (parent && parent.children) {
				parent.children = parent.children.filter(child => child.id !== commandId);
			}
		}

		// Remove from array
		this.commands = this.commands.filter(cmd => cmd.id !== commandId);

		// Remove from index
		this.commandIndex.delete(commandId);

		if (save) {
			await this.commitChanges();
		}
	}

	public async moveCommand(commandId: string, newParentId?: string): Promise<void> {
		const command = this.getCommandById(commandId);
		if (!command) return;

		// Remove from old parent's children array
		if (command.parentId) {
			const oldParent = this.getCommandById(command.parentId);
			if (oldParent && oldParent.children) {
				oldParent.children = oldParent.children.filter(child => child.id !== commandId);
			}
		}

		// Update parent ID
		command.parentId = newParentId;

		// Add to new parent's children array
		if (newParentId) {
			const newParent = this.getCommandById(newParentId);
			if (newParent) {
				if (!newParent.children) {
					newParent.children = [];
				}
				newParent.children.push(command);
			}
		}

		await this.commitChanges();
	}

	// Update entire command structure (used for drag-drop operations)
	public async updateStructure(commands: SlashCommand[]): Promise<void> {
		this.commands = [...commands];
		this.rebuildCommandIndex();
		await this.commitChanges();
	}

	public async restoreDefault(): Promise<void> {
		this.commands = DEFAULT_SETTINGS.bindings.map(cmd => {
			const newCmd: SlashCommand = { ...cmd };
			newCmd.children = [];
			return newCmd;
		});

		this.rebuildCommandIndex();
		await this.commitChanges();
	}
}
