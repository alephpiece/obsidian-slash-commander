import { Fragment, h } from "preact";
import SlashCommanderPlugin from "src/main";
import { CommandIconPair } from "src/types";
import { getCommandFromId, getCommandSourceName, isCommandNameUnique, ObsidianIcon } from "src/utils/util";

interface SuggestionProps {
	plugin: SlashCommanderPlugin;
	pair: CommandIconPair;
}

export default function SuggestionComponent({
	plugin,
	pair,
}: SuggestionProps): h.JSX.Element | null {
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
				<div className="cmdr-suggest-item-name">
					<div>
						{pair.name}
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