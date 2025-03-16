import { DEFAULT_SETTINGS } from "@/data/constants/defaultSettings";
import { CommanderSettings } from "@/data/models/Settings";
import SlashCommanderPlugin from "@/main";
import { SlashCommand } from "@/data/models/SlashCommand";
import { generateUniqueId } from "@/services/utils/util";

export default class SettingsStore {
	private plugin: SlashCommanderPlugin;
	private data: CommanderSettings;
	private listeners: Array<
		(settings: CommanderSettings, changes: Partial<CommanderSettings>) => void
	> = [];

	constructor(plugin: SlashCommanderPlugin) {
		this.plugin = plugin;
		this.data = DEFAULT_SETTINGS;
	}

	public async loadSettings(): Promise<CommanderSettings> {
		const data = Object.assign({}, DEFAULT_SETTINGS, await this.plugin.loadData());
		this.data = data;
		this.data.queryPattern = this.buildQueryPattern(this.data);
		
		// Migrate old command data format
		await this.migrateCommandData();
		
		return this.getSettings();
	}

	public async saveSettings(): Promise<void> {
		await this.plugin.saveData(this.data);
	}

	public getSettings(): CommanderSettings {
		return { ...this.data };
	}

	public updateSettings(settings: Partial<CommanderSettings>): void {
		this.data = { ...this.data, ...settings };

		if (
			settings.mainTrigger ||
			settings.extraTriggers ||
			settings.useExtraTriggers ||
			settings.triggerOnlyOnNewLine
		) {
			this.data.queryPattern = this.buildQueryPattern(this.data);
		}

		this.notifyListeners(settings);
		this.saveSettings().catch(console.error);
	}

	public subscribe(
		listener: (settings: CommanderSettings, changes: Partial<CommanderSettings>) => void
	): () => void {
		this.listeners.push(listener);
		return () => {
			this.listeners = this.listeners.filter(l => l !== listener);
		};
	}

	private notifyListeners(changes: Partial<CommanderSettings>): void {
		this.listeners.forEach(listener => listener(this.data, changes));
	}

	private buildQueryPattern(settings: CommanderSettings): RegExp {
		const allTriggers = [settings.mainTrigger].concat(settings.extraTriggers);
		const triggers = settings.useExtraTriggers ? allTriggers : [settings.mainTrigger];
		const escapedTriggers = triggers.map(trigger =>
			trigger.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
		);

		return new RegExp(
			`^(?<fullQuery>(?:${escapedTriggers.join("|")})(?<commandQuery>.*))`,
			"d"
		);
	}

	/**
	 * Migrate old SlashCommand data format to new format
	 * Old format: id stores Obsidian command ID
	 * New format: id is a unique identifier, action stores Obsidian command ID
	 */
	private async migrateCommandData(): Promise<void> {
		if (!this.data.bindings || this.data.bindings.length === 0) return;
		
		// Check if migration is needed (any command missing action or isGroup field)
		const needsMigration = this.data.bindings.some(cmd => 
			!('action' in cmd) || cmd.action === undefined || 
			!('isGroup' in cmd) || cmd.isGroup === undefined
		);
		
		if (!needsMigration) {
			console.log("SlashCommander: data is already in the new format, no migration needed");
			return;
		}
		
		console.log("SlashCommander: start migrating data to the new format");
		
		// First scan the entire command structure to identify duplicate IDs
		const idUsageCount = new Map<string, number>();
		
		const countIds = (commands: SlashCommand[]) => {
			for (const cmd of commands) {
				idUsageCount.set(cmd.id, (idUsageCount.get(cmd.id) || 0) + 1);
				
				if (cmd.children && cmd.children.length > 0) {
					countIds(cmd.children);
				}
			}
		};
		
		// Count usage of all IDs in the original data
		countIds(this.data.bindings);
		
		// Track newly assigned IDs to prevent conflicts
		const assignedIds = new Set<string>();
		
		// Recursive migration function
		const migrateCommand = (cmd: SlashCommand): SlashCommand => {
			// If no action field, copy id to action
			if (!('action' in cmd) || cmd.action === undefined) {
				cmd.action = cmd.id;
			}
			
			// Set isGroup field
			if (!('isGroup' in cmd) || cmd.isGroup === undefined) {
				// Determine if it's a command group by checking for child commands
				cmd.isGroup = (cmd.children && cmd.children.length > 0);
				
				// Special handling for IDs with old group prefix format
				if (cmd.id.startsWith("slash-commander:group-")) {
					cmd.isGroup = true;
				}
			}
			
			// Only replace IDs that appear multiple times in the original data
			if ((idUsageCount.get(cmd.id) || 0) > 1) {
				// Generate a new ID that doesn't conflict with existing or already assigned IDs
				let newId;
				do {
					newId = generateUniqueId();
				} while (idUsageCount.has(newId) || assignedIds.has(newId));
				
				assignedIds.add(newId);
				cmd.id = newId;
			}
			
			// Recursively process child commands
			if (cmd.children && cmd.children.length > 0) {
				cmd.children = cmd.children.map(migrateCommand);
			}
			
			return cmd;
		};
		
		// Migrate all root commands
		this.data.bindings = this.data.bindings.map(migrateCommand);
		
		// Save migrated data
		await this.saveSettings();
		console.log("SlashCommander: data migrated");
	}
}
