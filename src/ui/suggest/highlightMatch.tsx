import { FuzzyMatch } from "obsidian";
import { ReactElement } from "react";

import { SlashCommand } from "@/data/models/SlashCommand";

export function highlightMatch(result: FuzzyMatch<SlashCommand>): ReactElement | ReactElement[] {
    const { item, match } = result;

    // FIXME: this may be buggy
    if (!match) return <span>{item.name}</span>;

    const content: ReactElement[] = [];

    for (let i = 0; i < item.name.length; i++) {
        const interval = match.matches.find((m) => m[0] === i);
        if (interval) {
            content.push(
                <span key={`highlight-${i}`} className="suggestion-highlight">
                    {item.name.substring(interval[0], interval[1])}
                </span>
            );
            i += interval[1] - interval[0] - 1;
            continue;
        }

        content.push(<span key={`char-${i}`}>{item.name[i]}</span>);
    }
    return content;
}
