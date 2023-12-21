import { Fragment, h } from "preact";
import SlashCommanderPlugin from "src/main";
import { CommandIconPair } from "src/types";
import { getCommandFromId, getCommandSourceName, isCommandNameUnique } from "src/utils/util";
import ObsidianIcon from "src/components/obsidianIconComponent";
import { FuzzyMatch } from "obsidian";

interface SuggestionProps {
	plugin: SlashCommanderPlugin;
	result: FuzzyMatch<CommandIconPair>;
}

export default function SuggestionComponent({
	plugin,
	result,
}: SuggestionProps): h.JSX.Element | null {
	const { item: pair } = result;
	const cmd = getCommandFromId(plugin, pair.id);
	if (!cmd) {
		return null;
	}
	return (
		<Fragment>
			<div className="cmdr-suggest-item">
				<ObsidianIcon
					icon={pair.icon}
					size={20}
					className=
					{
						plugin.settings.showDescriptions ?
							"cmdr-suggest-item-icon-large" :
							"cmdr-suggest-item-icon"
					}
				/>
				<div className="cmdr-suggest-content">
					<div>
						{highlightMatch(result)}
						{
							plugin.settings.showSourcesForDuplicates &&
							!isCommandNameUnique(plugin, pair.name) && (
								<span className="cmdr-suggest-item-source">
									{` ${getCommandSourceName(plugin, cmd)}`}
								</span>
							)}
					</div>
					{
						plugin.settings.showDescriptions && (
							<div className="cmdr-suggest-item-description">
								{cmd.name}
							</div>
						)}
				</div>
			</div>
		</Fragment>);
}

function highlightMatch(
	result: FuzzyMatch<CommandIconPair>
	): h.JSX.Element | h.JSX.Element[] {
	const { item, match } = result;

	// FIXME: this may be buggy
	if (!match) return <span>{item.name}</span>;

	const content: h.JSX.Element[] = [];

	for (let i = 0; i < item.name.length; i++) {
		const interval = match.matches.find((m) => m[0] === i);
		if (interval) {
			content.push(
				<span className="suggestion-highlight">
					{item.name.substring(interval[0], interval[1])}
				</span>);
			i += interval[1] - interval[0] - 1;
			continue;
		}

		content.push(<span>{item.name[i]}</span>);
	}
	return content;
}