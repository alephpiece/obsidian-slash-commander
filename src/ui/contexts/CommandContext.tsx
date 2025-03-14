import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
import SlashCommanderPlugin from "@/main";
import { SlashCommand } from "@/data/models/SlashCommand";
import CommandStore from "@/data/stores/CommandStore";

/**
 * Context for managing command-related state and operations
 * Provides access to commands, plugin instance, and update functions
 */
interface CommandContextType {
  commands: SlashCommand[];
  updateCommands: (commands: SlashCommand[]) => void;
  syncCommands: () => void;
  plugin: SlashCommanderPlugin;
  store: CommandStore;
}

const CommandContext = createContext<CommandContextType>(null!);

interface CommandProviderProps {
  children: ReactNode;
  plugin: SlashCommanderPlugin;
  store: CommandStore;
  initialCommands: SlashCommand[];
}

export function CommandProvider({ 
  children, 
  plugin, 
  store,
  initialCommands 
}: CommandProviderProps) {
  const [commands, setCommands] = useState(initialCommands);
  
  // Subscribe to command store changes
  useEffect(() => {
    const handleStoreChange = (newCommands: SlashCommand[]): void => {
      setCommands([...newCommands]);
    };
    
    // Subscribe to changes
    const unsubscribe = store.on('changed', handleStoreChange);
    
    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, [store]);
  
  // Update commands in state and store
  const updateCommands = useCallback((newCommands: SlashCommand[]) => {
    setCommands([...newCommands]);
    store.updateStructure(newCommands);
  }, [store]);
  
  // Sync commands with store and save settings
  const syncCommands = useCallback(async () => {
    await store.commitChanges();
    await plugin.saveSettings();
  }, [plugin, store]);
  
  return (
    <CommandContext.Provider value={{ 
      commands, 
      updateCommands, 
      syncCommands,
      plugin,
      store
    }}>
      {children}
    </CommandContext.Provider>
  );
}

// Custom hook for accessing command context
export function useCommandContext() {
  const context = useContext(CommandContext);
  if (!context) {
    throw new Error("useCommandContext must be used within a CommandProvider");
  }
  return context;
}

export default CommandContext; 