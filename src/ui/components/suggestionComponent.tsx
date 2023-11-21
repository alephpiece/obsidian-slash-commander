import { Fragment, h } from "preact";
import SlashCommanderPlugin from "src/main";
import { CommandIconPair } from "src/types";
import { getCommandFromId, ObsidianIcon } from "src/util";

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
					className="cmdr-suggest-item-icon"
				/>
				<div className="cmdr-suggest-item-name">
					<div>{pair.name}</div>
					{!plugin.settings.hideDescriptions && (
						<div className="cmdr-suggest-item-description">
							{cmd.name}
						</div>
					)}
				</div>
			</div>
		</Fragment>);
}