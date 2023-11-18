import CommanderPlugin from "src/main";
import { CommandIconPair } from "src/types";
import { isModeActive } from "src/util";

export default class CommandManager {
	public pairs: CommandIconPair[];
	protected plugin: CommanderPlugin;

	public constructor(plugin: CommanderPlugin) {
		this.plugin = plugin;
		this.pairs = plugin.settings.slashPanel;

		this.plugin.settings.slashPanel.forEach((pair) =>
			this.addCommand(pair, false)
		);

		app.workspace.onLayoutReady(() => {
			// if (this.plugin.settings.showAddCommand) {
			// 	this.plugin.addRibbonIcon("plus", t("Add new"), async () =>
			// 		this.addCommand(await chooseNewCommand(plugin))
			// 	);
			// }
		});
	}

	public async addCommand(
		pair: CommandIconPair,
		newlyAdded = true
	): Promise<void> {
		if (newlyAdded) {
			this.plugin.settings.slashPanel.push(pair);
			await this.plugin.saveSettings();
		}
		if (isModeActive(pair.mode)) {
			this.plugin.register(() => this.removeCommand(pair, false));
		}
	}

	public async removeCommand(
		pair: CommandIconPair,
		remove = true
	): Promise<void> {
		if (remove) {
			this.plugin.settings.slashPanel.remove(pair);
			await this.plugin.saveSettings();
		}
	}

	// eslint-disable-next-line @typescript-eslint/no-empty-function
	public reorder(): void {
		this.plugin.settings.slashPanel.forEach((pair) => {
			this.removeCommand(pair, false);
			this.addCommand(pair, false);
		});
	}
}
