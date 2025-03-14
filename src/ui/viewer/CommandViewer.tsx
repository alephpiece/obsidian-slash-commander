import { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { SortableCommandList } from "@/ui/viewer/SortableCommandList";
import { CommandTools } from "@/ui/viewer/CommandTools";
import { useCommands } from "@/data/hooks/useCommandStore";

/**
 * Renders the command viewer component.
 * This is the main component for viewing and organizing commands.
 * Uses Zustand store to access commands.
 */
export function CommandViewer(): ReactElement {
	const { t } = useTranslation();
	const commands = useCommands();

	return (
		<div className="cmdr-command-viewer">
			{commands && commands.length > 0 ? (
				<div className="cmdr-commands-list">
					<SortableCommandList />
				</div>
			) : (
				<div className="cmdr-commands-empty">
					<h3>{t("bindings.no_command.detail")}</h3>
					<span>{t("bindings.no_command.add_now")}</span>
				</div>
			)}
			<CommandTools />
		</div>
	);
}
