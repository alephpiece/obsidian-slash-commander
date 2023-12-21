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

export function buildQueryPattern(commandTrigger: string): RegExp {
	const escapedTrigger = commandTrigger.replace(
		/[.*+?^${}()|[\]\\]/g,
		"\\$&",
	);

	// Always matching from the beginning of the line.
	// The trigger mode is tweaked by passing in different parts of the line.
	return new RegExp(
		`^\\s*(?<fullQuery>${escapedTrigger}(?<commandQuery>.*))`,
		"d"
	);
}