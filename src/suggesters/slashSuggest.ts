import { CommandIconPair } from "../types";
import SlashCommanderPlugin from "../main";
import { SlashCommandMatch } from "../utils/search";
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
import { h, render } from "preact";
import SuggestionComponent from "../components/suggestionComponent";
import { getCommandFromId } from "src/utils/util";

export class SlashSuggester extends EditorSuggest<FuzzyMatch<CommandIconPair>> {
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
    const queryPattern = this.plugin.settings.queryPattern;
    const currentLine = editor.getLine(cursor.line).slice(0, cursor.ch);
    let lastWordIndex = 0;
    let lastWord = currentLine;

    if (!this.plugin.settings.triggerOnlyOnNewLine) {
      // Only the last word of the line will trigger slash commands.
      lastWordIndex = currentLine.lastIndexOf(" ") + 1;
      lastWord = currentLine.slice(lastWordIndex, cursor.ch);
    }

    const matchRes = lastWord.match(queryPattern) as SlashCommandMatch | null;

    if (matchRes === null) {
      return null;
    }

    // Open the menu
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

  public getSuggestions(context: EditorSuggestContext): FuzzyMatch<CommandIconPair>[] {
    let results: FuzzyMatch<CommandIconPair>[];

    const search = prepareFuzzySearch(context.query);

    if (context.query == "") {
      // Return the full list
      results = this.plugin.manager.pairs.map((pair) => {
        return { item: pair, match: null } as unknown as FuzzyMatch<CommandIconPair>
      });
    } else {
      // Return fuzzy search results
      results = this.plugin.manager.pairs
        .map((cmd) => {
          return { item: cmd, match: search(cmd.name) } as FuzzyMatch<CommandIconPair>
        })
        .filter(({ match }) => match);
    }

    return results.filter(({ item }) => getCommandFromId(this.plugin, item.id));
  }

  public renderSuggestion(result: FuzzyMatch<CommandIconPair>, el: HTMLElement): void {
    render(
      h(SuggestionComponent, { plugin: this.plugin, pair: result.item }),
      el
    );
  }

  public selectSuggestion(result: FuzzyMatch<CommandIconPair>, _evt: MouseEvent | KeyboardEvent,): void {
    // Delete the trigger and command query.
    this.context?.editor.replaceRange('', this.context.start, this.context.end);
    if (result.item.id) {
      this.plugin.app.commands.executeCommandById(result.item.id);
    }
    this.close();
  }
}
