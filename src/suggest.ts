import { CommandIconPair } from "./types";
import SlashCommanderPlugin from "./main";
import jstyle from "./styles/jstyle";
import Fuse from 'fuse.js';
import {
  Editor,
  EditorPosition,
  EditorSuggest,
  EditorSuggestContext,
  EditorSuggestTriggerInfo,
  setIcon,
  TFile,
} from "obsidian";
import { getCommandFromId } from "./util";

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

type RegExpMatch = RegExpMatchArray & {
  indices: {
    groups: {
      commandQuery: [number, number];
      fullQuery: [number, number];
    };
  };
  groups: {
    commandQuery: string;
    fullQuery: string;
  };
};

const styles = jstyle.create({
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },

  menuItemIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',

    '& svg': {
      width: '1rem',
      height: '1rem',
    },
  },

  menuItemName: {
    flex: '1 1 auto',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
});

function buildQueryPattern(commandTrigger: string): RegExp {
  const escapedPrompt = commandTrigger.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&",
  );

  const temp = `^(?<fullQuery>${escapedPrompt}(?<commandQuery>.*))`;
  return new RegExp(temp, 'd');
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
    const triggerLineRegex = buildQueryPattern(this.plugin.settings.trigger);
    const currentLine = editor.getLine(cursor.line).slice(0, cursor.ch);
    const matchRes = currentLine.match(triggerLineRegex) as RegExpMatch | null;
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
    const commands = Object.values(this.plugin.settings.slashPanel);
    return searchSlashCommand(context.query, commands)
      .filter((cmd) => getCommandFromId(this.plugin, cmd.id));
  }

  public renderSuggestion(command: CommandIconPair, el: HTMLElement): void {
    el.createDiv(
      {
        cls: jstyle(styles.menuItem),
        attr: {
          role: 'button',
        },
      },
      div => {
        const iconContainer = div.createDiv(jstyle(styles.menuItemIcon));
        setIcon(iconContainer, command.icon);

        div.createDiv(jstyle(styles.menuItemName)).setText(command.name);
      },
    );
  }

  public selectSuggestion(command: CommandIconPair, _evt: MouseEvent | KeyboardEvent,): void {
    // Delete the trigger and command query.
    this.context?.editor.replaceRange('', this.context.start, this.context.end);
    if (command.id) {
      this.plugin.app.commands.executeCommandById(command.id);
    }
    this.close();
  }
}
