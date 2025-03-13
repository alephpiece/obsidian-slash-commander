import { ReactElement, useState, useMemo, useEffect } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { SlashCommand, isCommandGroup } from "@/data/models/SlashCommand";
import SlashCommanderPlugin from "@/main";
import { CommandListItem } from "./commandListItem";

interface SortableCommandItemProps {
	command: SlashCommand;
	commands: SlashCommand[];
	plugin: SlashCommanderPlugin;
	setState: () => void;
}

/**
 * A sortable command item that can be dragged and dropped.
 * For command groups, it also renders child commands.
 */
export function SortableCommandItem({
	command,
	commands,
	plugin,
	setState
}: SortableCommandItemProps): ReactElement {
	const [collapsed, setCollapsed] = useState(false);
	// Track previous dragging state to restore visibility after drag
	const [wasDragging, setWasDragging] = useState(false);
	
	// Get sortable attributes from dnd-kit
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging
	} = useSortable({ id: command.id });
	
	// Find all child commands if this is a command group
	const childCommands = useMemo(() => 
		commands.filter(cmd => cmd.parentId === command.id),
		[commands, command.id]
	);
	
	const isGroup = isCommandGroup(command);
	
	// Auto collapse children when dragging a group
	useEffect(() => {
		if (isGroup) {
			if (isDragging && !collapsed) {
				setCollapsed(true);
				setWasDragging(true);
			} else if (!isDragging && wasDragging) {
				setCollapsed(false);
				setWasDragging(false);
			}
		}
	}, [isDragging, isGroup, collapsed, wasDragging]);
	
	// Compute styles for the sortable item
	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1
	};
	
	return (
		<div className={`cmdr-sortable-item ${isDragging ? 'is-dragging' : ''}`}>
			<div
				ref={setNodeRef}
				style={style}
				className={`cmdr-command-wrapper ${isGroup ? 'is-group' : ''}`}
				{...attributes}
				{...listeners}
			>
				<CommandListItem
					cmd={command}
					plugin={plugin}
					commands={commands}
					setState={setState}
					isCollapsed={collapsed}
					onCollapse={isGroup ? (): void => setCollapsed(!collapsed) : undefined}
				/>
			</div>
			
			{/* Render child commands if this is a group and not collapsed */}
			{isGroup && !collapsed && childCommands.length > 0 && (
				<div className="cmdr-group-children">
					{childCommands.map(childCmd => (
						<SortableCommandItem
							key={childCmd.id}
							command={childCmd}
							commands={commands}
							plugin={plugin}
							setState={setState}
						/>
					))}
				</div>
			)}
		</div>
	);
} 