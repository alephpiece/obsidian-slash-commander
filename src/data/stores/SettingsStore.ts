import { DEFAULT_SETTINGS } from "@/data/constants/defaultSettings";
import { CommanderSettings } from "@/data/models/Settings";
import SlashCommanderPlugin from "@/main";
import { buildQueryPattern } from "@/services/utils/search";

export default class SettingsStore {
	private plugin: SlashCommanderPlugin;
	private data: CommanderSettings;

	constructor(plugin: SlashCommanderPlugin) {
		this.plugin = plugin;
		this.data = plugin.settings;
	}

	public async loadSettings(): Promise<CommanderSettings> {
		const data = Object.assign({}, DEFAULT_SETTINGS, await this.plugin.loadData());
		this.data = data;
		this.data.queryPattern = buildQueryPattern(this.data);
		return this.data;
	}

	public async saveSettings(): Promise<void> {
		await this.plugin.saveData(this.data);
	}

	public getSettings(): CommanderSettings {
		return this.data;
	}

	public updateSettings(settings: Partial<CommanderSettings>): void {
		this.data = { ...this.data, ...settings };
		if (
			settings.mainTrigger ||
			settings.extraTriggers ||
			settings.useExtraTriggers ||
			settings.triggerOnlyOnNewLine
		) {
			this.data.queryPattern = buildQueryPattern(this.data);
		}
	}
}
