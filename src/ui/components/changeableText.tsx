import { h } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";

interface Props {
	value: string;
	// eslint-disable-next-line no-unused-vars
	handleChange: (e: h.JSX.TargetedKeyboardEvent<HTMLInputElement>) => void;
	ariaLabel: string;
}

export default function ChangeableText({ value, handleChange, ariaLabel }: Props): h.JSX.Element {
	const [isEditing, setIsEditing] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);
	const [inputWidth, setInputWidth] = useState<number>(0);

	useEffect(() => {
		if (isEditing && inputRef.current) {
			inputRef.current.select();
			inputRef.current.focus();
		}
	}, [isEditing]);

	const handleKeyDown = (e: h.JSX.TargetedKeyboardEvent<HTMLInputElement>): void => {
		if (e.key === "Enter" && e.currentTarget.value.length > 0) {
			setIsEditing(false);
			handleChange(e);
		}
	};

	const handleDoubleClick = (e: h.JSX.TargetedMouseEvent<HTMLSpanElement>): void => {
		const span = e.currentTarget as HTMLSpanElement;
		setInputWidth(span.offsetWidth);
		setIsEditing(true);
	};

	return (
		<div class="cmdr-editable">
			{isEditing ? (
				<input
					type="text"
					value={value}
					style={{ width: `${inputWidth + 25}px` }}
					onKeyDown={handleKeyDown}
					onBlur={(): void => setIsEditing(false)}
					ref={inputRef}
					aria-label={ariaLabel}
				/>
			) : (
				<span onDblClick={handleDoubleClick} aria-label={ariaLabel}>
					{value}
				</span>
			)}
		</div>
	);
}
