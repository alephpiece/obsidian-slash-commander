import { DEFAULT_SETTINGS } from "@/data/constants/defaultSettings";
import SlashCommanderPlugin from "@/main";
import { 
	SlashCommand, 
	isCommandActive, 
	isValidSuggestItem, 
	getChildCommands
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
	private commandsMap: Map<string, SlashCommand> = new Map();
	private registeredCommands: Set<string> = new Set();
	protected plugin: SlashCommanderPlugin;

	public constructor(plugin: SlashCommanderPlugin) {
		super();
		this.plugin = plugin;
		this.initializeFromSettings();
	}

	private initializeFromSettings(): void {
		const bindings = this.plugin.settingsStore.getSettings().bindings;
		
		bindings.forEach(cmd => this.commandsMap.set(cmd.id, cmd));
		
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
			bindings: commands
		});
	}

	public async commitChanges(): Promise<void> {
		this.updateActiveCommands();
		await this.saveToSettings();
		this.emit('changed', this.getAllCommands());
	}

	public getAllCommands(): SlashCommand[] {
		return Array.from(this.commandsMap.values());
	}
	
	public getRootCommands(): SlashCommand[] {
		return this.getAllCommands().filter(cmd => !cmd.parentId);
	}
	
	public getCommandChildren(parentId: string): SlashCommand[] {
		return this.getAllCommands().filter(cmd => cmd.parentId === parentId);
	}

	public getValidCommands(): SlashCommand[] {
		// Filter and clone root commands
		const validRootCommands = this.getRootCommands()
			.filter(cmd => isValidSuggestItem(this.plugin, cmd))
			.map(cmd => ({...cmd}));
		
		// Process and filter children for command groups
		validRootCommands.forEach(cmd => {
			if (cmd.childrenIds?.length) {
				const validChildren = this.getCommandChildren(cmd.id)
					.filter(child => isValidSuggestItem(this.plugin, child))
					.map(child => ({...child}));
				
				cmd.childrenIds = validChildren.map(child => child.id);
			}
		});
		
		return validRootCommands;
	}

	public async addCommand(scmd: SlashCommand, newlyAdded = true): Promise<void> {
		if (!scmd.childrenIds) {
			scmd.childrenIds = [];
		}
		
		this.commandsMap.set(scmd.id, scmd);
		
		if (newlyAdded) {
			await this.commitChanges();
		}
	}

	public async removeCommand(commandId: string, save = true): Promise<void> {
		const command = this.commandsMap.get(commandId);
		if (!command) return;
		
		// Recursively remove child commands
		const childCommands = this.getCommandChildren(commandId);
		for (const child of childCommands) {
			await this.removeCommand(child.id, false);
		}
		
		this.commandsMap.delete(commandId);
		
		if (save) {
			await this.commitChanges();
		}
	}
	
	public async moveCommand(commandId: string, newParentId?: string): Promise<void> {
		const command = this.commandsMap.get(commandId);
		if (!command) return;
		
		command.parentId = newParentId;
		await this.commitChanges();
	}

	// Update entire command structure (used for drag-drop operations)
	public async updateStructure(commands: SlashCommand[]): Promise<void> {
		this.commandsMap.clear();
		for (const cmd of commands) {
			this.commandsMap.set(cmd.id, cmd);
		}
		await this.commitChanges();
	}

	public async restoreDefault(): Promise<void> {
		this.commandsMap.clear();
		
		DEFAULT_SETTINGS.bindings.forEach(cmd => {
			const newCmd: SlashCommand = { ...cmd };
			if (!newCmd.childrenIds) {
				newCmd.childrenIds = [];
			}
			this.commandsMap.set(newCmd.id, newCmd);
		});
		
		await this.commitChanges();
	}
}
