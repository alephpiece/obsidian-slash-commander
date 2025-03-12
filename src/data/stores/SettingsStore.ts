import { DEFAULT_SETTINGS } from "@/data/constants/defaultSettings";
import { CommanderSettings } from "@/data/models/Settings";
import SlashCommanderPlugin from "@/main";

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
}
