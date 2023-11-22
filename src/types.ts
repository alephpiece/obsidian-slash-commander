import { h } from "preact";

export interface CommanderSettings {
	confirmDeletion: boolean;
	showAddCommand: boolean;
	showDescriptions: boolean;
	debug: boolean;
	trigger: string;
	queryPattern: RegExp;
	slashPanel: CommandIconPair[];
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
