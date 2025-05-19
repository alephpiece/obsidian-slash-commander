import { CommanderSettings } from "@/data/models/Settings";

import { DEFAULT_COMMANDS } from "./defaultCommands";
import { DATA_VERSION } from "./version";

export const DEFAULT_SETTINGS: CommanderSettings = {
    version: DATA_VERSION,
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
