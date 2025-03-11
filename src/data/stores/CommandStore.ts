import { DEFAULT_SETTINGS } from "@/data/constants/defaultSettings";
import SlashCommanderPlugin from "@/main";
import { SlashCommand, isCommandActive, isValidSuggestItem } from "@/data/models/SlashCommand";

export default class CommandStore {
	public data: SlashCommand[];
	protected plugin: SlashCommanderPlugin;

	public constructor(plugin: SlashCommanderPlugin) {
		this.plugin = plugin;
		this.data = plugin.settings.bindings;

		this.data.forEach(scmd => this.addCommand(scmd, false));
	}

	public getValidCommands(): SlashCommand[] {
		return structuredClone(this.data).filter(scmd => {
			if (scmd.children?.length) {
				scmd.children = scmd.children.filter(child =>
					isValidSuggestItem(this.plugin, child)
				);
			}
			return isValidSuggestItem(this.plugin, scmd);
		});
	}

	public async addCommand(scmd: SlashCommand, newlyAdded = true): Promise<void> {
		if (newlyAdded) {
			this.data.push(scmd);
			await this.plugin.saveSettings();
		}
		if (isCommandActive(this.plugin, scmd)) {
			this.plugin.register(() => this.removeCommand(scmd, false));
		}
	}

	public async removeCommand(scmd: SlashCommand, remove = true): Promise<void> {
		if (remove) {
			this.data.remove(scmd);
			await this.plugin.saveSettings();
		}
	}

	public reorder(): void {
		this.data.forEach(scmd => {
			this.removeCommand(scmd, false);
			this.addCommand(scmd, false);
		});
	}

	public async restoreDefault(): Promise<void> {
		this.data = Object.assign([], DEFAULT_SETTINGS.bindings);
		this.plugin.settings.bindings = this.data;
		await this.plugin.saveSettings();
	}
}
