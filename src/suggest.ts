import { CommandIconPair } from "./types";
import SlashCommanderPlugin from "./main";
import Fuse from 'fuse.js';
import {
  Editor,
  EditorPosition,
  EditorSuggest,
  EditorSuggestContext,
  EditorSuggestTriggerInfo,
  TFile,
} from "obsidian";
import { getCommandFromId, SlashCommandMatch } from "./util";
import { h, render } from "preact";
import SuggestionComponent from "./ui/components/suggestionComponent";

const fuseOptions = {
  // isCaseSensitive: false,
  // includeScore: false,
  // shouldSort: true,
  // includeMatches: false,
  // findAllMatches: false,
  // minMatchCharLength: 1,
  // location: 0,
  threshold: 0.5,
  // distance: 100,
  // useExtendedSearch: false,
  // ignoreLocation: false,
  // ignoreFieldNorm: false,
  // fieldNormWeight: 1,
  keys: ["name"]
};

export default function searchSlashCommand(pattern: string, commands: CommandIconPair[]): CommandIconPair[] {
  const fuse = new Fuse(commands, fuseOptions);
  return pattern == "" ? commands : fuse.search(pattern).map(({ item }: { item: any }) => item);
}

export class SlashSuggester extends EditorSuggest<CommandIconPair> {
  private plugin: SlashCommanderPlugin;

  public constructor(plugin: SlashCommanderPlugin) {
    super(plugin.app);
    this.plugin = plugin;
  }

  public onTrigger(
    cursor: EditorPosition,
    editor: Editor,
    _file: TFile,
  ): EditorSuggestTriggerInfo | null {
    const currentLine = editor.getLine(cursor.line).slice(0, cursor.ch);
    const matchRes = currentLine.match(this.plugin.settings.queryPattern) as SlashCommandMatch | null;
    if (matchRes === null) {
      return null;
    }

    // Open the menu
    return {
      start: {
        ...cursor,
        // Starting ch of the prompt + command group
        ch: matchRes.indices.groups.fullQuery[0],
      },
      end: cursor,
      query: matchRes.groups.commandQuery,
    };
  }

  public getSuggestions(context: EditorSuggestContext): CommandIconPair[] {
    const pairs = Object.values(this.plugin.settings.bindings);
    return searchSlashCommand(context.query, pairs)
      .filter((cmd) => getCommandFromId(this.plugin, cmd.id));
  }

  public renderSuggestion(pair: CommandIconPair, el: HTMLElement): void {
		render(
			h(SuggestionComponent, {plugin: this.plugin, pair: pair }),
      el
		);
  }

  public selectSuggestion(pair: CommandIconPair, _evt: MouseEvent | KeyboardEvent,): void {
    // Delete the trigger and command query.
    this.context?.editor.replaceRange('', this.context.start, this.context.end);
    if (pair.id) {
      this.plugin.app.commands.executeCommandById(pair.id);
    }
    this.close();
  }
}
