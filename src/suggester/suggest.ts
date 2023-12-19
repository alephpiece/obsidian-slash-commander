import { CommandIconPair } from "../types";
import SlashCommanderPlugin from "../main";
import { getFuzzySuggestions, SlashCommandMatch } from "../search";
import {
  Editor,
  EditorPosition,
  EditorSuggest,
  EditorSuggestContext,
  EditorSuggestTriggerInfo,
  TFile,
} from "obsidian";
import { h, render } from "preact";
import SuggestionComponent from "../components/suggestionComponent";

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

  public getSuggestions(context: EditorSuggestContext): CommandIconPair[] {
    return getFuzzySuggestions(context.query, this.plugin);
  }

  public renderSuggestion(pair: CommandIconPair, el: HTMLElement): void {
    render(
      h(SuggestionComponent, { plugin: this.plugin, pair: pair }),
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
