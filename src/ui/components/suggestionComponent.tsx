import { h } from "preact";
import SlashCommanderPlugin from "@/main";
import {
	SlashCommand,
	getCommandFromId,
	getCommandSourceName,
	isCommandGroup,
	isCommandActiveUnique,
} from "@/data/models/SlashCommand";
import ObsidianIcon from "@/ui/components/obsidianIconComponent";
import { FuzzyMatch } from "obsidian";

interface SuggestionProps {
	plugin: SlashCommanderPlugin;
	result: FuzzyMatch<SlashCommand>;
}

export default function SuggestionComponent({
	plugin,
	result,
}: SuggestionProps): h.JSX.Element | null {
	const { item: scmd } = result;
	const cmd = getCommandFromId(plugin, scmd.id);
	if (!isCommandGroup(scmd) && !cmd) {
		return null;
	}
	return (
		<div className="cmdr-suggest-item">
			<ObsidianIcon
				icon={scmd.icon}
				size="var(--icon-m)"
				className={
					plugin.settings.showDescriptions
						? "cmdr-suggest-item-icon-large"
						: "cmdr-suggest-item-icon"
				}
			/>
			<div className="cmdr-suggest-content">
				<div>
					{highlightMatch(result)}
					{
						// Show sources for non-group commands
						plugin.settings.showSourcesForDuplicates &&
							!isCommandGroup(scmd) &&
							!isCommandActiveUnique(plugin, scmd) && (
								<span className="cmdr-suggest-item-source">
									{/*@ts-expect-error*/}
									{` ${getCommandSourceName(plugin, cmd)}`}
								</span>
							)
					}
				</div>
				{
					// Show descriptions for non-group commands
					plugin.settings.showDescriptions && !isCommandGroup(scmd) && (
						<div className="cmdr-suggest-item-description">
							{/*@ts-expect-error*/}
							{cmd.name}
						</div>
					)
				}
			</div>
			{isCommandGroup(scmd) && (
				<span className="cmdr-suggest-group-indicator">
					<ObsidianIcon icon="chevron-right" size="var(--icon-s)" />
				</span>
			)}
		</div>
	);
}

export function highlightMatch(result: FuzzyMatch<SlashCommand>): h.JSX.Element | h.JSX.Element[] {
	const { item, match } = result;

	// FIXME: this may be buggy
	if (!match) return <span>{item.name}</span>;

	const content: h.JSX.Element[] = [];

	for (let i = 0; i < item.name.length; i++) {
		const interval = match.matches.find(m => m[0] === i);
		if (interval) {
			content.push(
				<span className="suggestion-highlight">
					{item.name.substring(interval[0], interval[1])}
				</span>
			);
			i += interval[1] - interval[0] - 1;
			continue;
		}

		content.push(<span>{item.name[i]}</span>);
	}
	return content;
}
