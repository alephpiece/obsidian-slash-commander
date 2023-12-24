import { setIcon } from "obsidian";
import { ComponentProps, h } from "preact";
import { useRef, useLayoutEffect } from "preact/hooks";

interface ObsidianIconProps extends ComponentProps<"div"> {
	icon: string;
	size?: number;
}

export default function ObsidianIcon({
	icon, size, ...props
}: ObsidianIconProps): h.JSX.Element {
	const iconEl = useRef<HTMLDivElement>(null);

	useLayoutEffect(() => {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		setIcon(iconEl.current!, icon);
	}, [icon, size]);

	return <div ref={iconEl} {...props} />;
}
