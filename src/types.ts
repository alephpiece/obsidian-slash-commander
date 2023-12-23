import { Editor } from "obsidian";

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
	bindings: CommandIconPair[];
}

export type Mode = "desktop" | "any" | "mobile" | string;

export interface CommandIconPair {
	id: string;
	icon: string;
	name: string;
	mode: Mode;
	color?: string;
}

interface InternalPlugin {
	enabled: boolean;
}

interface InternalPlugins {
	"slash-command": InternalPlugin;
}

/* eslint-disable no-unused-vars */
declare module "obsidian" {
	interface App {
		commands: {
			commands: {
				[id: string]: Command;
			};
			executeCommandById: (id: string) => void;
		};
		plugins: {
			manifests: {
				[id: string]: PluginManifest;
			};
		};
		internalPlugins: {
			plugins: InternalPlugins;
			getPluginById<T extends keyof InternalPlugins>(id: T): InternalPlugins[T];
		};
		statusBar: {
			containerEl: HTMLElement;
		};
		appId: string;
		isMobile: boolean;
		setting: {
			closeActiveTab: () => void;
			openTabById: (id: string) => void;
			activeTab: {
				containerEl: HTMLElement;
			};
		};
	}
}

export interface MenuSuggestion {
	pair: CommandIconPair;
    element: HTMLDivElement;
}

// Credits go to https://github.com/chetachiezikeuzor/Highlightr-Plugin
export type EnhancedEditor = Editor & {
	cursorCoords: Function;
	coordsAtPos: Function;
	cm: CodeMirror.Editor & { coordsAtPos: Function };
	hasFocus: Function;
	getSelection: Function;
};

// Credits go to https://github.com/chetachiezikeuzor/Highlightr-Plugin
export interface Coords {
	top: number;
	left: number;
	right: number;
	bottom: number;
}