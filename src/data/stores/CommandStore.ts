import { DEFAULT_SETTINGS } from "@/data/constants/defaultSettings";
import SlashCommanderPlugin from "@/main";
import { 
	SlashCommand, 
	isCommandActive, 
	isValidSuggestItem, 
	getChildCommands
} from "@/data/models/SlashCommand";

export default class CommandStore {
	private commandsMap: Map<string, SlashCommand> = new Map();
	protected plugin: SlashCommanderPlugin;

	public constructor(plugin: SlashCommanderPlugin) {
		this.plugin = plugin;
		this.initializeFromSettings();
	}

	private initializeFromSettings(): void {
		const bindings = this.plugin.settingsStore.getSettings().bindings;
		
		bindings.forEach(cmd => this.commandsMap.set(cmd.id, cmd));
		
		// Register commands with Obsidian
		this.getAllCommands().forEach(cmd => {
			if (isCommandActive(this.plugin, cmd)) {
				this.plugin.register(() => this.removeCommand(cmd.id, false));
			}
		});
	}

	private async saveToSettings(): Promise<void> {
		const commands = this.getAllCommands();
		this.plugin.settingsStore.updateSettings({
			bindings: commands
		});
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
			await this.saveToSettings();
		}
		
		if (isCommandActive(this.plugin, scmd)) {
			this.plugin.register(() => this.removeCommand(scmd.id, false));
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
			await this.saveToSettings();
		}
	}
	
	public async moveCommand(commandId: string, newParentId?: string): Promise<void> {
		const command = this.commandsMap.get(commandId);
		if (!command) return;
		
		command.parentId = newParentId;
		await this.saveToSettings();
	}

	public reorder(): void {
		this.getAllCommands().forEach(cmd => {
			if (isCommandActive(this.plugin, cmd)) {
				this.plugin.register(() => this.removeCommand(cmd.id, false));
			}
		});
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
		
		await this.saveToSettings();
	}
	
	// For backward compatibility
	public get data(): SlashCommand[] {
		return this.getAllCommands();
	}
}
