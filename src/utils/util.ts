import { CommandIconPair } from "../types";
import SlashCommanderPlugin from "../main";
import AddCommandModal from "../settings/addCommandModal";
import ChooseIconModal from "../settings/chooseIconModal";
import { Command } from "obsidian";
import ChooseCustomNameModal from "../settings/chooseCustomNameModal";

/**
 * It creates a modal, waits for the user to select a command, and then creates another modal to wait
 * for the user to select an icon
 * @param {SlashCommanderPlugin} plugin - The plugin that is calling the modal.
 * @returns {CommandIconPair}
 */
export async function chooseNewCommand(
	plugin: SlashCommanderPlugin
): Promise<CommandIconPair> {
	const command = await new AddCommandModal(plugin).awaitSelection();

	let icon;
	if (!command.hasOwnProperty("icon")) {
		icon = await new ChooseIconModal(plugin).awaitSelection();
	}

	const name = await new ChooseCustomNameModal(plugin, command.name).awaitSelection();

	return {
		id: command.id,
		//This cannot be undefined anymore
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		icon: icon ?? command.icon!,
		name: name || command.name,
		mode: "any",
	};
}

export function getCommandFromId(plugin: SlashCommanderPlugin, id: string): Command | null {
	return plugin.app.commands.commands[id] ?? null;
}

export function isModeActive(plugin: SlashCommanderPlugin, mode: string): boolean {
	const { isMobile, appId } = plugin.app;
	return (
		mode === "any" ||
		mode === appId ||
		(mode === "mobile" && isMobile) ||
		(mode === "desktop" && !isMobile)
	);
}

export function getCommandSourceName(
	plugin: SlashCommanderPlugin,
	cmd: Command
): string {
	const owningPluginID = cmd.id.split(":").first();
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const owningPlugin = plugin.app.plugins.manifests[owningPluginID!];
	return owningPlugin ? owningPlugin.name : "Obsidian";
}

export function isCommandNameUnique(
	plugin: SlashCommanderPlugin,
	commandName: string
): boolean {
	const matches = plugin.settings.bindings.filter(
		({ name }) => name == commandName
	);
	return matches.length == 1;
}

export function isTriggerInConflicts(
	plugin: SlashCommanderPlugin
): boolean {
	const { mainTrigger, extraTriggers } = plugin.settings;
	return plugin.app.internalPlugins.plugins["slash-command"].enabled
		&& (mainTrigger == "/"
			|| (plugin.settings.moreTriggers && extraTriggers.includes("/")));
}