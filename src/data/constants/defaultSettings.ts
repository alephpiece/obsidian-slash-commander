import { DEFAULT_COMMANDS } from "@/data/constants/defaultCommands";
import { CommanderSettings } from "@/data/models/Settings";

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
