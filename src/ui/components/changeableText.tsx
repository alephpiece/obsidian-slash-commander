import type { ReactElement, KeyboardEvent, MouseEvent } from "react";
import { useEffect, useRef, useState } from "react";

interface Props {
	value: string;
	handleChange: (e: KeyboardEvent<HTMLInputElement>) => void;
	ariaLabel: string;
}

export default function ChangeableText({ value, handleChange, ariaLabel }: Props): ReactElement {
	const [isEditing, setIsEditing] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);
	const [inputWidth, setInputWidth] = useState<number>(0);

	useEffect(() => {
		if (isEditing && inputRef.current) {
			inputRef.current.select();
			inputRef.current.focus();
		}
	}, [isEditing]);

	const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
		if (e.key === "Enter" && e.currentTarget.value.length > 0) {
			setIsEditing(false);
			handleChange(e);
		}
	};

	const handleDoubleClick = (e: MouseEvent<HTMLSpanElement>): void => {
		const span = e.currentTarget;
		setInputWidth(span.offsetWidth);
		setIsEditing(true);
	};

	return (
		<div className="cmdr-editable">
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
				<span onDoubleClick={handleDoubleClick} aria-label={ariaLabel}>
					{value}
				</span>
			)}
		</div>
	);
}
