import { Command } from "obsidian";
import { SlashCommand } from "@/data/models/SlashCommand";
import AddCommandModal from "@/ui/modals/addCommandModal";
import ChooseIconModal from "@/ui/modals/chooseIconModal";
import ChooseCustomNameModal from "@/ui/modals/chooseCustomNameModal";
import SlashCommanderPlugin from "@/main";
import { t } from "i18next";

/**
 * Creates a new command by prompting the user to select a command, icon, and name
 * @param {SlashCommanderPlugin} plugin - The plugin instance
 * @returns {SlashCommand} A new slash command object
 */
export async function chooseNewCommand(plugin: SlashCommanderPlugin): Promise<SlashCommand> {
	const command = await new AddCommandModal(plugin).awaitSelection();

	let icon;
	if (!command.hasOwnProperty("common.icon")) {
		icon = await new ChooseIconModal(plugin).awaitSelection();
	}

	const name = await new ChooseCustomNameModal(plugin, command.name).awaitSelection();

	return {
		id: command.id,
		// This cannot be undefined anymore
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		icon: icon ?? command.icon!,
		name: name || command.name,
		mode: "any",
	};
}

export function isTriggerInConflicts(plugin: SlashCommanderPlugin): boolean {
	const settings = plugin.settingsStore.getSettings();
	const { mainTrigger, extraTriggers, useExtraTriggers } = settings;

	return (
		plugin.app.internalPlugins.plugins["slash-command"].enabled &&
		(mainTrigger == "/" || (useExtraTriggers && extraTriggers.includes("/")))
	);
}

export function isTriggeredAnywhere(pair: SlashCommand): boolean {
	return typeof pair.triggerMode === "undefined" || pair.triggerMode === "anywhere";
}

/**
 * Gets device mode information including icon and translated name
 */
export function getDeviceModeInfo(mode = "any"): { deviceModeIcon: string; deviceModeName: string } {
	const icons: { [iconName: string]: string } = {
		mobile: "smartphone",
		desktop: "monitor",
		any: "cmdr-all-devices",
	};
	const deviceModeIcon = icons[mode] ?? "airplay";
	const deviceModeName = mode.match(/desktop|mobile|any/)
		? t(`bindings.device_mode.${mode}`)
		: t("bindings.device_mode.this");

	return { deviceModeIcon, deviceModeName };
}

/**
 * Gets trigger mode information including icon and translated name
 */
export function getTriggerModeInfo(mode = "anywhere"): {
	triggerModeIcon: string;
	triggerModeName: string;
} {
	const icons: { [iconName: string]: string } = {
		newline: "cmdr-triggered-newline",
		inline: "cmdr-triggered-inline",
		anywhere: "regex",
	};
	const triggerModeIcon = icons[mode] ?? "regex";
	const triggerModeName = t(`bindings.trigger_mode.${mode}`);

	return { triggerModeIcon, triggerModeName };
}
