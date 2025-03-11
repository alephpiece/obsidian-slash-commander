import { CommanderSettings } from "@/data/models/Settings";

export type SlashCommandMatch = RegExpMatchArray & {
	indices: {
		groups: {
			commandQuery: [number, number];
			fullQuery: [number, number];
		};
	};
	groups: {
		commandQuery: string;
		fullQuery: string;
	};
};

export function buildQueryPattern(settings: CommanderSettings): RegExp {
	const allTriggers = [settings.mainTrigger].concat(settings.extraTriggers);
	const triggers = settings.useExtraTriggers ? allTriggers : [settings.mainTrigger];

	const escapedTriggers = triggers.map(trigger => trigger.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

	// Always matching from the beginning of the line.
	// The trigger mode is tweaked by passing in different parts of the line.
	return new RegExp(`^(?<fullQuery>(?:${escapedTriggers.join("|")})(?<commandQuery>.*))`, "d");
}
