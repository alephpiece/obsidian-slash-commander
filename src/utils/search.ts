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

export function buildQueryPattern(commandTriggers: string[], moreTriggers: boolean): RegExp {
	const triggers = moreTriggers ? commandTriggers : commandTriggers.slice(0, 0);

	const escapedTriggers = triggers.map((trigger) => trigger.replace(
		/[.*+?^${}()|[\]\\]/g,
		"\\$&",
	));

	// Always matching from the beginning of the line.
	// The trigger mode is tweaked by passing in different parts of the line.
	return new RegExp(
		`^\\s*(?<fullQuery>[${escapedTriggers.join("|")}](?<commandQuery>.*))`,
		"d"
	);
}