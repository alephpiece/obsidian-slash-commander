/* eslint-disable @typescript-eslint/no-unsafe-function-type */
import { Editor } from "obsidian";

import { SlashCommand } from "@/data/models/SlashCommand";

export interface CommanderSettings {
    confirmDeletion: boolean;
    showDescriptions: boolean;
    showSourcesForDuplicates: boolean;
    debug: boolean;
    mainTrigger: string;
    extraTriggers: string[];
    useExtraTriggers: boolean;
    triggerOnlyOnNewLine: boolean;
    queryPattern: RegExp;
    bindings: SlashCommand[];
}

export interface MenuSuggestion {
    pair: SlashCommand;
    element: HTMLDivElement;
}

export type EnhancedEditor = Editor & {
    cursorCoords: Function;
    coordsAtPos: Function;
    cm: CodeMirror.Editor & { coordsAtPos: Function };
    hasFocus: Function;
    getSelection: Function;
};

export interface Coords {
    top: number;
    left: number;
    right: number;
    bottom: number;
}
