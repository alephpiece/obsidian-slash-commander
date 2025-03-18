import { SlashCommand } from "@/data/models/SlashCommand";
import SlashCommanderPlugin from "@/main";
import { t } from "i18next";
import { useSettingStore } from "@/data/stores/useSettingStore";

/**
 * Generates a unique ID that doesn't conflict with any existing SlashCommand
 * @param prefix Optional prefix for the ID
 * @returns A unique ID string
 */
export function generateUniqueId(prefix = ""): string {
	const settingStore = useSettingStore.getState();
	
	// Generate a random ID
	let id: string;
	do {
		id = prefix + crypto.randomUUID();
		// Check if this ID already exists
	} while (!settingStore.isIdUnique(id));
	
	return id;
}

export function isTriggerInConflicts(plugin: SlashCommanderPlugin): boolean {
	const settings = useSettingStore.getState().settings;
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
