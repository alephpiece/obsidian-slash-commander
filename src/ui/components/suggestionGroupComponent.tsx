import type { ReactElement } from "react";
import SlashCommanderPlugin from "@/main";
import { SlashCommand, isCommandGroup } from "@/data/models/SlashCommand";
import ObsidianIcon from "@/ui/components/obsidianIconComponent";
import { FuzzyMatch } from "obsidian";
import { highlightMatch } from "./suggestionComponent";

interface SuggestionProps {
    plugin: SlashCommanderPlugin;
    result: FuzzyMatch<SlashCommand>;
}

export default function SuggestionGroupComponent({
    plugin,
    result,
}: SuggestionProps): ReactElement | null {
    const { item: pair } = result;
    if (!isCommandGroup(pair)) {
        return null;
    }
    return (
        <div className="cmdr-suggest-item">
            <ObsidianIcon
                icon={pair.icon}
                size={plugin.settings.showDescriptions ? `var(--icon-l) + 4px` : "var(--icon-l)"}
                className="cmdr-suggest-item-icon"
            />
            <span className="cmdr-suggest-content">{highlightMatch(result)}</span>
            <ObsidianIcon
                icon="chevron-right"
                size="var(--icon-m)"
                className="cmdr-suggest-item-icon"
            />
        </div>
    );
}
