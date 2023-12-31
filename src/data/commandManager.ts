import { DEFAULT_SETTINGS } from "src/data/constants";
import SlashCommanderPlugin from "src/main";
import { CommandIconPair } from "src/data/types";
import { isModeActive, isValidPair } from "src/utils/util";

export default class CommandManager {
	public pairs: CommandIconPair[];
	protected plugin: SlashCommanderPlugin;

	public constructor(plugin: SlashCommanderPlugin) {
		this.plugin = plugin;
		this.pairs = plugin.settings.bindings;

		this.pairs.forEach((pair) =>
			this.addCommand(pair, false)
		);
	}

	public validPairs(): CommandIconPair[] {
		return this.pairs.filter((pair) =>
			isValidPair(pair, this.plugin)
		);
	}

	public async addCommand(
		pair: CommandIconPair,
		newlyAdded = true
	): Promise<void> {
		if (newlyAdded) {
			this.pairs.push(pair);
			await this.plugin.saveSettings();
		}
		if (isModeActive(this.plugin, pair.mode)) {
			this.plugin.register(() => this.removeCommand(pair, false));
		}
	}

	public async removeCommand(
		pair: CommandIconPair,
		remove = true
	): Promise<void> {
		if (remove) {
			this.pairs.remove(pair);
			await this.plugin.saveSettings();
		}
	}

	// eslint-disable-next-line @typescript-eslint/no-empty-function
	public reorder(): void {
		this.pairs.forEach((pair) => {
			this.removeCommand(pair, false);
			this.addCommand(pair, false);
		});
	}

	public async restoreDefault(): Promise<void> {
		this.pairs = Object.assign([], DEFAULT_SETTINGS.bindings);
		this.plugin.settings.bindings = this.pairs;
		await this.plugin.saveSettings();
	}
}
