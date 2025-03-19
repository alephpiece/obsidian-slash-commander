import type { ReactElement, ReactNode, ChangeEvent } from "react";
import { useState } from "react";

interface BaseComponentProps {
    children: ReactNode;
    name: string;
    description: string;
    className?: string;
}

export function BaseComponent({
    name,
    description,
    children,
    className,
}: BaseComponentProps): ReactElement {
    return (
        <div className={`setting-item ${className ?? ""}`}>
            <div className="setting-item-info">
                <div className="setting-item-name">{name}</div>
                <div className="setting-item-description">{description}</div>
            </div>
            <div className="setting-item-control">{children}</div>
        </div>
    );
}

interface SettingProps<T> {
    name: string;
    description: string;
    changeHandler: (value: T) => void;
    value: T;
}

export function ToggleComponent(props: SettingProps<boolean>): ReactElement {
    const [state, setState] = useState(props.value);

    return (
        <BaseComponent name={props.name} description={props.description} className="mod-toggle">
            <div
                className={`checkbox-container ${state ? "is-enabled" : ""}`}
                onClick={(): void => {
                    setState(!state);
                    props.changeHandler(state);
                }}
            />
        </BaseComponent>
    );
}

export function TextBoxComponent(props: SettingProps<string>): ReactElement {
    return (
        <BaseComponent description={props.description} name={props.name} className="cmdr-text">
            <input
                type="text"
                value={props.value}
                onChange={(event: ChangeEvent<HTMLInputElement>): void => {
                    const newValue = event.target.value;
                    if (props.value !== newValue) {
                        props.changeHandler(newValue);
                    }
                }}
            />
        </BaseComponent>
    );
}
