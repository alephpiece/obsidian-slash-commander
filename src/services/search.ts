export type SlashCommandMatch = RegExpMatchArray & {
    indices: {
        groups: {
            commandQuery: [number, number];
            fullQuery: [number, number];
        };
    };
    groups: {
        commandQuery: string;
        fullQuery: string;
    };
};

/**
 * Build a regex pattern for slash command triggers
 */
export function buildQueryPattern(
    mainTrigger: string,
    extraTriggers: string[],
    useExtraTriggers: boolean
): RegExp {
    const allTriggers = [mainTrigger].concat(extraTriggers);
    const triggers = useExtraTriggers ? allTriggers : [mainTrigger];
    const escapedTriggers = triggers.map((trigger) =>
        trigger.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    );
    return new RegExp(`^(?<fullQuery>(?:${escapedTriggers.join("|")})(?<commandQuery>.*))`, "d");
}
