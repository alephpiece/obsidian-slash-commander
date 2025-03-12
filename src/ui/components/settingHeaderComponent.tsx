import type { ComponentProps, ReactElement } from "react";
import { useState } from "react";

interface SettingCollapserProps extends ComponentProps<"details"> {
	title: string;
	children: ReactElement | ReactElement[];
}

export default function SettingCollapser({ title, children }: SettingCollapserProps): ReactElement {
	const [open, setOpen] = useState(true);

	const toggleHandler = (): void => {
		setOpen(!open);
	};

	return (
		<div className="cmdr-setting-collapser" aria-expanded={open}>
			<h2 className="cmdr-setting-collapser-header" onClick={toggleHandler}>
				{title}
			</h2>
			<div className="cmdr-setting-collapser-content">{children}</div>
		</div>
	);
}
