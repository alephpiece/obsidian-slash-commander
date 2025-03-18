import SlashCommanderPlugin from "@/main";
import { SlashCommand, isValidSuggestItem } from "@/data/models/SlashCommand";
import { DEFAULT_SETTINGS } from "@/data/constants/defaultSettings";
import { CommanderSettings } from "@/data/models/Settings";
import { generateUniqueId } from "@/services/utils/util";

/**
 * 命令相关的服务函数
 * 这些函数不包含状态管理逻辑，仅处理纯业务逻辑
 */

/**
 * 获取有效（应该显示）的命令
 */
export function getValidCommands(plugin: SlashCommanderPlugin, commands: SlashCommand[]): SlashCommand[] {
    if (!plugin) return [];

    // 过滤并克隆根命令
    const validRootCommands = commands
        .filter(cmd => isValidSuggestItem(plugin, cmd))
        .map(cmd => ({ ...cmd }));

    // 处理并过滤命令组的子命令
    validRootCommands.forEach(cmd => {
        if (cmd.children && cmd.children.length > 0) {
            const validChildren = cmd.children
                .filter(child => isValidSuggestItem(plugin, child))
                .map(child => ({ ...child }));

            cmd.children = validChildren;
        }
    });

    return validRootCommands;
}

/**
 * 验证命令结构，检查重复ID
 */
export function validateCommandStructure(commands: SlashCommand[]): void {
    // 检查根级别的重复ID
    const rootIds = new Set<string>();
    for (const cmd of commands) {
        if (rootIds.has(cmd.id)) {
            throw new Error(`重复的根命令ID: ${cmd.id}`);
        }
        rootIds.add(cmd.id);

        // 检查每个父命令的子命令中的重复ID
        if (cmd.children && cmd.children.length > 0) {
            const childIds = new Set<string>();
            for (const child of cmd.children) {
                if (childIds.has(child.id)) {
                    throw new Error(`重复的子命令ID: ${child.id}，在父命令 ${cmd.id} 中`);
                }
                childIds.add(child.id);
            }
        }
    }
}

/**
 * 检查命令 ID 在整个命令结构中是否唯一
 */
export function isIdUnique(id: string, commands: SlashCommand[]): boolean {
    // 检查根级别
    if (commands.some(cmd => cmd.id === id)) {
        return false;
    }

    // 检查所有子命令
    for (const cmd of commands) {
        if (cmd.children && cmd.children.length > 0) {
            if (cmd.children.some(child => child.id === id)) {
                return false;
            }
        }
    }

    return true;
}

/**
 * 根据ID查找命令，可选指定父命令上下文
 */
export function findCommand(
    commands: SlashCommand[],
    id: string,
    parentId?: string
): SlashCommand | undefined {
    if (parentId) {
        // 在父命令中查找
        const parent = commands.find(cmd => cmd.id === parentId);
        return parent?.children?.find(child => child.id === id);
    } else {
        // 在根级别查找
        return commands.find(cmd => cmd.id === id);
    }
}

/**
 * 获取默认命令
 */
export function getDefaultCommands(): SlashCommand[] {
    return DEFAULT_SETTINGS.bindings.map(cmd => {
        const newCmd = { ...cmd };
        newCmd.children = [];
        newCmd.parentId = undefined;
        return newCmd;
    });
}

/**
 * 构建查询模式正则表达式
 */
export function buildQueryPattern(
    mainTrigger: string,
    extraTriggers: string[],
    useExtraTriggers: boolean
): RegExp {
    const allTriggers = [mainTrigger].concat(extraTriggers);
    const triggers = useExtraTriggers ? allTriggers : [mainTrigger];
    const escapedTriggers = triggers.map(trigger =>
        trigger.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    );
    return new RegExp(
        `^(?<fullQuery>(?:${escapedTriggers.join("|")})(?<commandQuery>.*))`,
        "d"
    );
}

/**
 * Migrate old SlashCommand data format to new format
 * Old format: id stores Obsidian command ID
 * New format: id is a unique identifier, action stores Obsidian command ID
 */
export async function migrateCommandData(
    data: CommanderSettings,
    saveCallback: (settings: CommanderSettings) => Promise<void>
): Promise<CommanderSettings> {
    if (!data.bindings || data.bindings.length === 0) return data;

    // Check if migration is needed
    const needsMigration = data.bindings.some(cmd =>
        !('action' in cmd) || cmd.action === undefined ||
        !('isGroup' in cmd) || cmd.isGroup === undefined
    );

    if (!needsMigration) {
        console.log("SlashCommander: data is already in the new format, no migration needed");
        return data;
    }

    console.log("SlashCommander: start migrating data to the new format");

    // First scan the entire command structure to identify duplicate IDs
    const idUsageCount = new Map<string, number>();

    const countIds = (commands: SlashCommand[]) => {
        for (const cmd of commands) {
            idUsageCount.set(cmd.id, (idUsageCount.get(cmd.id) || 0) + 1);

            if (cmd.children && cmd.children.length > 0) {
                countIds(cmd.children);
            }
        }
    };

    // Count usage of all IDs in the original data
    countIds(data.bindings);

    // Track newly assigned IDs to prevent conflicts
    const assignedIds = new Set<string>();

    // Recursive migration function
    const migrateCommand = (cmd: SlashCommand): SlashCommand => {
        // If no action field, copy id to action
        if (!('action' in cmd) || cmd.action === undefined) {
            cmd.action = cmd.id;
        }

        // Set isGroup field
        if (!('isGroup' in cmd) || cmd.isGroup === undefined) {
            // Determine if it's a command group by checking for child commands
            cmd.isGroup = (cmd.children && cmd.children.length > 0);

            // Special handling for IDs with old group prefix format
            if (cmd.id.startsWith("slash-commander:group-")) {
                cmd.isGroup = true;
            }
        }

        // Only replace IDs that appear multiple times in the original data
        if ((idUsageCount.get(cmd.id) || 0) > 1) {
            // Generate a new ID that doesn't conflict with existing or already assigned IDs
            let newId;
            do {
                newId = generateUniqueId();
            } while (idUsageCount.has(newId) || assignedIds.has(newId));

            assignedIds.add(newId);
            cmd.id = newId;
        }

        // Recursively process child commands
        if (cmd.children && cmd.children.length > 0) {
            cmd.children = cmd.children.map(migrateCommand);
        }

        return cmd;
    };

    // Migrate all root commands
    data.bindings = data.bindings.map(migrateCommand);

    // Save migrated data
    await saveCallback(data);
    console.log("SlashCommander: data migrated");

    return data;
}
