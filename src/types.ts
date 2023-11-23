import { h } from "preact";

export interface CommanderSettings {
	confirmDeletion: boolean;
	showDescriptions: boolean;
	showSourcesForDuplicates: boolean;
	debug: boolean;
	trigger: string;
	queryPattern: RegExp;
	bindings: CommandIconPair[];
}

export interface Tab {
	name: string;
	tab: h.JSX.Element;
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
	enable: (b: boolean) => void;
	disable: (b: boolean) => void;
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
