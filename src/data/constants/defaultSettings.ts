import { CommanderSettings } from "../types";
import { DEFAULT_COMMANDS } from "./defaultCommands";

export const DEFAULT_SETTINGS: CommanderSettings = {
	confirmDeletion: true,
	showDescriptions: false,
	showSourcesForDuplicates: true,
	debug: false,
	mainTrigger: "/",
	extraTriggers: [],
	useExtraTriggers: false,
	triggerOnlyOnNewLine: false,
	queryPattern: new RegExp("^(?<fullQuery>/(?<commandQuery>.*))", "d"),
	bindings: DEFAULT_COMMANDS,
};
