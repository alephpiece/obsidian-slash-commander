import type { ReactElement } from "react";
import SlashCommanderPlugin from "@/main";
import { SlashCommand, isCommandGroup } from "@/data/models/SlashCommand";
import ObsidianIcon from "@/ui/components/obsidianIconComponent";
import { FuzzyMatch } from "obsidian";
import { highlightMatch } from "./highlightMatch";

interface SuggestionProps {
    plugin: SlashCommanderPlugin;
    result: FuzzyMatch<SlashCommand>;
}

/**
 * A component that displays a suggested command group. Should not be used for commands.
 * @param plugin - The plugin instance.
 * @param result - The fuzzy match result.
 * @returns A React element representing the suggested command group.
 */
export default function SuggestedGroup({ plugin, result }: SuggestionProps): ReactElement | null {
    const { item: scmd } = result;
    if (!isCommandGroup(scmd)) {
        return null;
    }
    return (
        <div className="cmdr-suggest-item">
            <span className="cmdr-suggest-group-name">{result.item.name}</span>
        </div>
    );
}
