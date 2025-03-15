import { DEFAULT_SETTINGS } from "@/data/constants/defaultSettings";
import SlashCommanderPlugin from "@/main";
import {
	SlashCommand,
	isCommandActive,
	isRootCommand,
	isValidSuggestItem,
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
	// Primary storage: ordered array of root commands
	private commands: SlashCommand[] = [];

	// Set of IDs for active commands that are registered with Obsidian
	private registeredCommands: Set<string> = new Set();

	protected plugin: SlashCommanderPlugin;

	public constructor(plugin: SlashCommanderPlugin) {
		super();
		this.plugin = plugin;
		this.initializeFromSettings();
	}

	// Find a root command by ID
	private findRootCommand(id: string): SlashCommand | undefined {
		return this.commands.find(cmd => cmd.id === id);
	}

	// Find a child command within a specific parent
	private findChildCommand(parentId: string, childId: string): SlashCommand | undefined {
		const parent = this.findRootCommand(parentId);
		return parent?.children?.find(child => child.id === childId);
	}

	// Find a command with optional context (parent ID)
	public findCommand(id: string, parentId?: string): SlashCommand | undefined {
		if (parentId) {
			return this.findChildCommand(parentId, id);
		}
		return this.findRootCommand(id);
	}

	private initializeFromSettings(): void {
		const bindings = this.plugin.settingsStore.getSettings().bindings;

		// Initialize commands array
		this.commands = [...bindings];

		// Initialize registered commands
		this.updateActiveCommands();
	}

	// Update which commands should be active based on current state
	private updateActiveCommands(): void {
		// Get currently active command IDs from all levels
		const shouldBeActive = new Set<string>();
		
		// Function to collect active command IDs
		const collectActiveIds = (cmds: SlashCommand[]): void => {
			for (const cmd of cmds) {
				if (isCommandActive(this.plugin, cmd)) {
					shouldBeActive.add(cmd.id);
				}
				if (cmd.children && cmd.children.length > 0) {
					collectActiveIds(cmd.children);
				}
			}
		};
		
		collectActiveIds(this.commands);

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
			this.plugin.register(() => this.removeCommand(id, undefined, false));
			this.registeredCommands.add(id);
		}

		// Update tracking of registered commands
		for (const id of toUnregister) {
			this.registeredCommands.delete(id);
		}
	}

	private async saveToSettings(): Promise<void> {
		// Get all commands including child commands in a format suitable for serialization
		const commands = this.getAllCommands();
		
		// Save to settings
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
		// Return a deep copy of commands
		return this.commands.map(cmd => {
			const result = { ...cmd };
			
			if (cmd.children && cmd.children.length > 0) {
				result.children = cmd.children.map(child => ({ ...child }));
			}
			
			return result;
		});
	}

	public getValidCommands(): SlashCommand[] {
		// Filter and clone root commands
		const validRootCommands = this.getAllCommands()
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

		// If it's a root command, check for duplicate IDs at root level
		if (!scmd.parentId) {
			if (this.findRootCommand(scmd.id)) {
				throw new Error(`Root command with ID ${scmd.id} already exists`);
			}
			this.commands.push(scmd);
		} else {
			// If it's a child command, check for duplicate IDs within the parent
			const parent = this.findRootCommand(scmd.parentId);
			if (parent) {
				if (!parent.children) {
					parent.children = [];
				}
				
				// Check for duplicate child ID within this parent
				if (parent.children.some(child => child.id === scmd.id)) {
					throw new Error(`Child command with ID ${scmd.id} already exists in parent ${scmd.parentId}`);
				}
				
				parent.children.push(scmd);
			}
		}
		
		if (newlyAdded) {
			await this.commitChanges();
		}
	}

	public async removeCommand(commandId: string, parentId?: string, save = true): Promise<void> {
		if (parentId) {
			// Remove a child command
			const parent = this.findRootCommand(parentId);
			if (parent?.children) {
				parent.children = parent.children.filter(child => child.id !== commandId);
			}
		} else {
			// Remove a root command and all its children
			this.commands = this.commands.filter(cmd => cmd.id !== commandId);
		}

		if (save) {
			await this.commitChanges();
		}
	}

	/**
	 * Move a command from one location to another
	 * @param commandId ID of the command to move
	 * @param sourceParentId Source parent ID or undefined if from root
	 * @param targetParentId Target parent ID or undefined if moving to root
	 */
	public async moveCommand(commandId: string, sourceParentId: string | undefined, targetParentId: string | undefined): Promise<void> {
		// Find the source command
		let sourceCommand: SlashCommand | undefined;
		
		if (sourceParentId) {
			// From parent command
			const sourceParent = this.findRootCommand(sourceParentId);
			if (sourceParent?.children) {
				const childIndex = sourceParent.children.findIndex(c => c.id === commandId);
				if (childIndex !== -1) {
					sourceCommand = { ...sourceParent.children[childIndex] };
					sourceParent.children.splice(childIndex, 1);
				}
			}
		} else {
			// From root level
			const rootIndex = this.commands.findIndex(c => c.id === commandId);
			if (rootIndex !== -1) {
				sourceCommand = { ...this.commands[rootIndex] };
				this.commands.splice(rootIndex, 1);
			}
		}
		
		if (!sourceCommand) return;
		
		// Update parentId
		sourceCommand.parentId = targetParentId;
		
		if (targetParentId) {
			// Move to parent command
			const targetParent = this.findRootCommand(targetParentId);
			if (targetParent) {
				if (!targetParent.children) {
					targetParent.children = [];
				}
				
				// Check for duplicate ID within target parent
				if (targetParent.children.some(child => child.id === commandId)) {
					throw new Error(`Child command with ID ${commandId} already exists in target parent ${targetParentId}`);
				}
				
				targetParent.children.push(sourceCommand);
			}
		} else {
			// Move to root level
			// Check for duplicate ID at root level
			if (this.findRootCommand(commandId)) {
				throw new Error(`Root command with ID ${commandId} already exists`);
			}
			
			this.commands.push(sourceCommand);
		}
		
		await this.commitChanges();
	}

	// Update entire command structure
	public async updateStructure(commands: SlashCommand[]): Promise<void> {
		// Validate the command structure for duplicate IDs at same level
		this.validateCommandStructure(commands);
		
		// Update commands
		this.commands = [...commands];
		await this.commitChanges();
	}

	// Validate command structure for duplicate IDs at same level
	private validateCommandStructure(commands: SlashCommand[]): void {
		// Check for duplicate IDs at root level
		const rootIds = new Set<string>();
		for (const cmd of commands) {
			if (rootIds.has(cmd.id)) {
				throw new Error(`Duplicate root command ID: ${cmd.id}`);
			}
			rootIds.add(cmd.id);
			
			// Check for duplicate IDs within each parent's children
			if (cmd.children && cmd.children.length > 0) {
				const childIds = new Set<string>();
				for (const child of cmd.children) {
					if (childIds.has(child.id)) {
						throw new Error(`Duplicate child command ID: ${child.id} in parent ${cmd.id}`);
					}
					childIds.add(child.id);
				}
			}
		}
	}

	public async restoreDefault(): Promise<void> {
		this.commands = DEFAULT_SETTINGS.bindings.map(cmd => {
			const newCmd: SlashCommand = { ...cmd };
			newCmd.children = [];
			newCmd.parentId = undefined;
			return newCmd;
		});

		await this.commitChanges();
	}
}
