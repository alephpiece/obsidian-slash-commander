import type { ComponentProps, ReactElement } from "react";
import { useState } from "react";

interface SettingCollapserProps extends ComponentProps<"details"> {
	title: string;
	children: ReactElement | ReactElement[];
}

export function SettingCollapser({ title, children }: SettingCollapserProps): ReactElement {
	const [open, setOpen] = useState(true);

	const toggleHandler = (): void => {
		setOpen(!open);
	};

	return (
		<div className="cmdr-setting-collapser" aria-expanded={open}>
			<h2
				className="cmdr-setting-collapser-header"
				onClick={toggleHandler}
				aria-expanded={open}
			>
				{title}
			</h2>
			<div className="cmdr-setting-collapser-content">{children}</div>
		</div>
	);
}

interface SettingCollapserWithToolsProps extends ComponentProps<"details"> {
	title: string;
	tools: ReactElement | ReactElement[];
	children: ReactElement | ReactElement[];
}

export function SettingCollapserWithTools({
	title,
	tools,
	children,
}: SettingCollapserWithToolsProps): ReactElement {
	const [open, setOpen] = useState(true);

	const toggleHandler = (): void => {
		setOpen(!open);
	};

	return (
		<div className="cmdr-setting-collapser" aria-expanded={open}>
			<h2 className="cmdr-setting-collapser-header-container">
				<div
					className="cmdr-setting-collapser-header"
					onClick={toggleHandler}
					aria-expanded={open}
				>
					{title}
				</div>
				<div className="cmdr-setting-collapser-tools">{tools}</div>
			</h2>
			<div className="cmdr-setting-collapser-content">{children}</div>
		</div>
	);
}
