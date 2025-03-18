import type { ReactElement } from "react";
import SlashCommanderPlugin from "@/main";
import { SlashCommand } from "@/data/models/SlashCommand";
import {
    getObsidianCommand,
    getCommandSourceName,
    isCommandGroup,
    isActiveCommandNameUnique,
} from "@/services/command";
import ObsidianIcon from "@/ui/components/obsidianIconComponent";
import { FuzzyMatch } from "obsidian";
import { useSettings } from "@/data/stores/useSettingStore";
import { highlightMatch } from "./highlightMatch";

interface SuggestionProps {
    plugin: SlashCommanderPlugin;
    result: FuzzyMatch<SlashCommand>;
}

/**
 * A component that displays a suggested command. Should not be used for command groups.
 * @param plugin - The plugin instance.
 * @param result - The fuzzy match result.
 * @returns A React element representing the suggested command.
 */
export default function SuggestedCommand({ plugin, result }: SuggestionProps): ReactElement | null {
    const { item: scmd } = result;
    const cmd = getObsidianCommand(plugin, scmd);
    const settings = useSettings();

    if (!cmd || isCommandGroup(scmd)) {
        return null;
    }
    return (
        <div className="cmdr-suggest-item">
            <ObsidianIcon
                icon={scmd.icon}
                size={settings.showDescriptions ? `var(--icon-l) + 4px` : "var(--icon-l)"}
                className="cmdr-suggest-item-icon"
            />
            <div className="cmdr-suggest-content">
                <div>
                    {highlightMatch(result)}
                    {settings.showSourcesForDuplicates && !isActiveCommandNameUnique(plugin, scmd) && (
                        <span className="cmdr-suggest-item-source">
                            {` ${getCommandSourceName(plugin, cmd!)}`}
                        </span>
                    )}
                </div>
                {settings.showDescriptions && (
                    <div className="cmdr-suggest-item-description">{cmd!.name}</div>
                )}
            </div>
        </div>
    );
}
