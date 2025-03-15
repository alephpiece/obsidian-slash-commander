import { SlashCommand } from "@/data/models/SlashCommand";
import SlashCommanderPlugin from "@/main";
import { t } from "i18next";
import { useCommandStore } from "@/data/hooks/useCommandStore";

/**
 * Generates a unique ID that doesn't conflict with any existing SlashCommand
 * @param prefix Optional prefix for the ID
 * @returns A unique ID string
 */
export function generateUniqueId(prefix = ""): string {
	const store = useCommandStore.getState().store;
	
	// Exit early if store isn't available
	if (!store) {
		return prefix + crypto.randomUUID();
	}
	
	// Generate a random ID
	let id: string;
	do {
		id = prefix + crypto.randomUUID();
		// Check if this ID already exists in the store
	} while (!store.isIdUnique(id));
	
	return id;
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
