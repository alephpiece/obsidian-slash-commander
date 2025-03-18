import React, { forwardRef } from "react";
import type { UniqueIdentifier } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CommandComponent } from "@/ui/viewer/CommandComponent";
import ConfirmDeleteModal from "@/ui/modals/ConfirmDeleteModal";
import ChooseIconModal from "@/ui/modals/ChooseIconModal";
import BindingEditorModal from "@/ui/modals/BindingEditorModal";
import { useSettingStore } from "@/data/stores/useSettingStore";
import { isRootCommand } from "@/data/models/SlashCommand";
import { CommandViewerItemProps } from "./types";
import ObsidianIcon from "../components/obsidianIconComponent";
import { useSettings } from "@/data/stores/useSettingStore";

/**
 * Renders a sortable command item in the viewer.
 * Integrates with dnd-kit for drag-and-drop functionality.
 */
export function CommandViewerItem({
	id,
	command,
	depth,
	indentationWidth,
	indicator,
	collapsed,
	onCollapse,
	onRemove,
	plugin,
	childCount,
	clone,
}: CommandViewerItemProps) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id,
		data: {
			depth,
			indentationWidth,
			command,
		},
	});

	const { addCommand, saveSettings } = useSettingStore();
	const settings = useSettings();

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : undefined,
		"--depth": depth,
		"--indentation-width": `${indentationWidth}px`,
	};

	return (
		<div
			ref={setNodeRef}
			className={`cmdr-command-wrapper cmdr-sortable-item ${clone ? "cmdr-clone" : ""}`}
			style={style as React.CSSProperties}
			data-id={id}
		>
			<ObsidianIcon
				icon="grip-vertical"
				className="setting-editor-extra-setting-button cmdr-drag-handle-icon"
				{...attributes}
				{...listeners}
			/>
			<CommandComponent
				pair={command}
				plugin={plugin}
				handleRemove={async (): Promise<void> => {
					if (onRemove) {
						if (settings.confirmDeletion) {
							await new ConfirmDeleteModal(
								plugin,
								command,
								onRemove
							).didChooseRemove();
						} else {
							onRemove();
						}
					}
				}}
				handleNewIcon={(): void => {
					new ChooseIconModal(plugin, command, () => saveSettings()).open();
				}}
				handleRename={(name): void => {
					command.name = name;
					saveSettings();
				}}
				handleDeviceModeChange={(mode?: string): void => {
					const modes = ["any", "desktop", "mobile", plugin.app.appId];
					const nextIndex = (modes.indexOf(command.mode ?? "any") + 1) % modes.length;
					command.mode = mode || modes[nextIndex];
					saveSettings();
				}}
				handleTriggerModeChange={(mode?: string): void => {
					const modes = ["anywhere", "newline", "inline"];
					const nextIndex =
						(modes.indexOf(command.triggerMode ?? "anywhere") + 1) % modes.length;
					command.triggerMode = mode || modes[nextIndex];
					saveSettings();
				}}
				handleAddChild={async (): Promise<void> => {
					// Only allow adding children to top-level commands
					if (!isRootCommand(command)) return;

					if (plugin) {
						const newCommand = await new BindingEditorModal(plugin).awaitSelection();
						if (newCommand) {
							// Set the parentId to indicate this command belongs to the parent
							newCommand.parentId = command.id;

							// Add command to store with parentId already set
							await addCommand(newCommand);

							// Sync changes to UI and save settings
							await saveSettings();
						}
					}
				}}
				isCollapsed={collapsed}
				handleCollapse={onCollapse}
			/>

			{indicator && isDragging && childCount && childCount > 0 ? (
				<div className="cmdr-children-count">{childCount}</div>
			) : null}
		</div>
	);
}
