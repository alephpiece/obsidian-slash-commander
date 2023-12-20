import { CommandIconPair } from "../types";
import Fuse from 'fuse.js';

export function searchSlashCommand(
	pattern: string,
	commands: CommandIconPair[]
): CommandIconPair[] {
	const fuseOptions = {
		minMatchCharLength: pattern.length,
		threshold: 0.4,
		keys: ["name"]
	};
	const fuse = new Fuse(commands, fuseOptions);

	return pattern == "" ? commands : fuse.search(pattern).map(({ item }: { item: any }) => item);
}

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