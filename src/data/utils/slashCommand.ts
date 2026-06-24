import type { SlashCommand } from "@/data/models/SlashCommand";

export function cloneSlashCommandTree(commands: SlashCommand[]): SlashCommand[] {
    return commands.map((command) => ({
        ...command,
        visibility: command.visibility
            ? {
                  ...command.visibility,
                  pathPatterns: command.visibility.pathPatterns
                      ? {
                            include: command.visibility.pathPatterns.include
                                ? [...command.visibility.pathPatterns.include]
                                : undefined,
                            exclude: command.visibility.pathPatterns.exclude
                                ? [...command.visibility.pathPatterns.exclude]
                                : undefined,
                        }
                      : undefined,
              }
            : undefined,
        children: command.children ? cloneSlashCommandTree(command.children) : command.children,
    }));
}
