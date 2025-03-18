import {
	Editor,
	EditorPosition,
	EditorSuggest,
	EditorSuggestContext,
	EditorSuggestTriggerInfo,
	FuzzyMatch,
	prepareFuzzySearch,
	TFile,
} from "obsidian";
import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { isCommandGroup, SlashCommand, getObsidianCommand } from "@/data/models/SlashCommand";
import SlashCommanderPlugin from "@/main";
import { SlashCommandMatch } from "@/services/utils/search";
import SuggestionComponent from "@/ui/components/suggestionComponent";
import { SubSuggest } from "./subSuggest";
import { useSettingStore } from "@/data/stores/useSettingStore";

export class SlashSuggester extends EditorSuggest<FuzzyMatch<SlashCommand>> {
	private plugin: SlashCommanderPlugin;
	private containerEl: HTMLElement;

	public constructor(plugin: SlashCommanderPlugin) {
		super(plugin.app);
		this.plugin = plugin;
	}

	public onTrigger(
		cursor: EditorPosition,
		editor: Editor,
		_file: TFile
	): EditorSuggestTriggerInfo | null {
		const settings = useSettingStore.getState().settings;
		const queryPattern = settings.queryPattern;
		const currentLine = editor.getLine(cursor.line).slice(0, cursor.ch);
		let lastWordIndex = 0;
		let lastWord = currentLine;

		if (!settings.triggerOnlyOnNewLine) {
			// Only the last word of the line will trigger slash commands.
			lastWordIndex = currentLine.lastIndexOf(" ") + 1;
			lastWord = currentLine.slice(lastWordIndex, cursor.ch);
		}

		const matchRes = lastWord.match(queryPattern) as SlashCommandMatch | null;

		if (matchRes === null) {
			return null;
		}

		return {
			start: {
				...cursor,
				// Starting ch of the prompt + command group
				ch: lastWordIndex + matchRes.indices.groups.fullQuery[0],
			},
			end: cursor,
			query: matchRes.groups.commandQuery,
		};
	}

	public getSuggestions(context: EditorSuggestContext): FuzzyMatch<SlashCommand>[] {
		let results: FuzzyMatch<SlashCommand>[];

		const search = prepareFuzzySearch(context.query);
		const validCommands = useSettingStore.getState().getValidCommands();

		if (context.query == "") {
			// Return the full list
			results = validCommands.map(scmd => {
				return { item: scmd, match: null } as unknown as FuzzyMatch<SlashCommand>;
			});
		} else {
			// Return fuzzy search results
			results = validCommands
				.map(scmd => {
					return { item: scmd, match: search(scmd.name) } as FuzzyMatch<SlashCommand>;
				})
				.filter(({ match }) => match);
		}

		// Filter by trigger mode
		const onNewLine = context.start.ch == 0;

		return results.filter(
			({ item }) =>
				(onNewLine && item.triggerMode != "inline") ||
				(!onNewLine && item.triggerMode != "newline")
		);
	}

	public selectSuggestion(
		result: FuzzyMatch<SlashCommand>,
		_evt: MouseEvent | KeyboardEvent
	): void {
		// Delete the trigger and command query.
		this.context?.editor.replaceRange("", this.context.start, this.context.end);

		if (!isCommandGroup(result.item) && result.item.action) {
			this.plugin.app.commands.executeCommandById(result.item.action);
		} else {
			// Open sub-suggester with child commands
			const subSuggester = new SubSuggest(
				this.plugin,
				this.containerEl,
				result.item.children ?? []
			);
			subSuggester.open();
		}
		this.close();
	}

	public renderSuggestion(result: FuzzyMatch<SlashCommand>, el: HTMLElement): void {
		this.containerEl = el;
		const root = createRoot(el);
		root.render(createElement(SuggestionComponent, { plugin: this.plugin, result: result }));
	}

	public unload(): void {
		// Clean up resources if needed
	}
}
