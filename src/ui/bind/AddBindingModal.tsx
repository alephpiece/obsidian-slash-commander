import { useEffect, useState } from "react";
import { FuzzyMatch, Modal, setIcon } from "obsidian";
import { SlashCommand, DeviceMode, TriggerMode } from "@/data/models/SlashCommand";
import SlashCommanderPlugin from "@/main";
import { t } from "i18next";
import { ICON_LIST } from "@/data/constants/icons";
import { Command } from "obsidian";

/**
 * Modal for adding a new binding with all options in one interface
 * Allows users to set name, command, icon, trigger mode and device mode at once
 */
export default class AddBindingModal extends Modal {
  private plugin: SlashCommanderPlugin;
  private commands: Command[];
  private filteredCommands: Command[] = [];
  private commandSearchValue = "";
  
  private filteredIcons: string[] = [];
  private iconSearchValue = "";
  
  private name = "";
  private selectedCommand: Command | null = null;
  private selectedIcon = "";
  private triggerMode: TriggerMode = "anywhere";
  private deviceMode: DeviceMode = "any";
  
  private errors: { [key: string]: string } = {};
  
  private resolve: ((value: SlashCommand | null) => void) | null = null;
  private reject: ((reason?: any) => void) | null = null;

  constructor(plugin: SlashCommanderPlugin) {
    super(plugin.app);
    this.plugin = plugin;
    this.commands = Object.values(plugin.app.commands.commands);
  }

  public async awaitSelection(): Promise<SlashCommand | null> {
    this.open();
    return new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("cmdr-add-binding-modal");

    // Header
    contentEl.createEl("h2", { text: t("modals.bind.title") });
    
    // Command field
    this.createCommandField(contentEl);
    
    // Icon field
    this.createIconField(contentEl);
    
    // Name field
    this.createNameField(contentEl);
    
    // Trigger mode field
    this.createTriggerModeField(contentEl);
    
    // Device mode field
    this.createDeviceModeField(contentEl);
    
    // Buttons
    const buttonContainer = contentEl.createDiv({ cls: "cmdr-modal-button-container" });
    
    const saveButton = buttonContainer.createEl("button", { 
      text: t("common.save"),
      cls: "mod-cta" 
    });
    saveButton.addEventListener("click", () => {
      this.saveNewCommand();
    });

    const cancelButton = buttonContainer.createEl("button", { text: t("common.cancel") });
    cancelButton.addEventListener("click", () => {
      this.close();
    });
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
    if (this.reject) {
      this.reject("Modal closed");
      this.reject = null;
      this.resolve = null;
    }
  }

  private createNameField(container: HTMLElement) {
    const wrapper = container.createDiv({ cls: "cmdr-setting-item" });
    wrapper.createDiv({ cls: "cmdr-setting-item-name", text: t("modals.bind.name.field") });
    
    const input = wrapper.createEl("input", { 
      type: "text", 
      cls: "cmdr-input",
      placeholder: t("modals.bind.name.placeholder")
    });
    
    input.addEventListener("input", (e) => {
      this.name = (e.target as HTMLInputElement).value;
      this.clearError("name", wrapper);
    });
    
    // Error container
    wrapper.createDiv({ cls: "cmdr-setting-error" });
  }

  private createCommandField(container: HTMLElement) {
    const wrapper = container.createDiv({ cls: "cmdr-setting-item" });
    wrapper.createDiv({ cls: "cmdr-setting-item-name", text: t("modals.bind.command.field") });
    
    const suggestWrapper = wrapper.createDiv({ cls: "cmdr-suggest-wrapper" });
    const input = suggestWrapper.createEl("input", { 
      type: "text", 
      cls: "cmdr-input",
      placeholder: t("modals.bind.command.placeholder") 
    });
    
    const suggestContainer = suggestWrapper.createDiv({ cls: "cmdr-suggest-container" });
    suggestContainer.style.display = "none";
    
    // Update suggestions when input changes
    input.addEventListener("input", (e) => {
      this.commandSearchValue = (e.target as HTMLInputElement).value;
      this.updateCommandSuggestions(suggestContainer);
      
      if (this.commandSearchValue) {
        suggestContainer.style.display = "block";
      } else {
        suggestContainer.style.display = "none";
      }
      this.clearError("command", wrapper);
    });
    
    // Close suggestions when clicking outside
    document.addEventListener("click", (e) => {
      if (!suggestWrapper.contains(e.target as Node)) {
        suggestContainer.style.display = "none";
      }
    });
    
    // Initial suggestions
    this.updateCommandSuggestions(suggestContainer);
    
    // Error container
    wrapper.createDiv({ cls: "cmdr-setting-error" });
  }

  private updateCommandSuggestions(container: HTMLElement) {
    container.empty();
    
    this.filteredCommands = this.commands.filter(cmd => 
      cmd.name.toLowerCase().includes(this.commandSearchValue.toLowerCase())
    ).slice(0, 10);
    
    if (this.filteredCommands.length === 0) {
      container.createDiv({ cls: "cmdr-empty-state", text: t("modals.bind.no_results") });
      return;
    }
    
    for (const command of this.filteredCommands) {
      const item = container.createDiv({ cls: "cmdr-suggest-item" });
      
      const content = item.createDiv({ cls: "cmdr-suggest-item-content" });
      content.createDiv({ cls: "cmdr-suggest-item-title", text: command.name });
      
      if (command.icon) {
        const iconContainer = item.createDiv({ cls: "cmdr-suggest-item-icon" });
        setIcon(iconContainer, command.icon);
      }
      
      item.addEventListener("click", () => {
        this.selectedCommand = command;
        (container.parentElement?.querySelector("input") as HTMLInputElement).value = command.name;
        container.style.display = "none";
        
        // If command has an icon, auto-select it
        if (command.icon) {
          this.selectedIcon = command.icon;
          const iconInput = this.contentEl.querySelector(".cmdr-icon-input") as HTMLInputElement;
          if (iconInput) {
            iconInput.value = command.icon;
            // Clear icon error if it exists
            const iconWrapper = iconInput.closest(".cmdr-setting-item") as HTMLElement;
            if (iconWrapper) {
              this.clearError("icon", iconWrapper);
            }
          }
        }
      });
    }
  }

  private createIconField(container: HTMLElement) {
    const wrapper = container.createDiv({ cls: "cmdr-setting-item" });
    wrapper.createDiv({ cls: "cmdr-setting-item-name", text: t("modals.bind.icon.field") });
    
    const suggestWrapper = wrapper.createDiv({ cls: "cmdr-suggest-wrapper" });
    const input = suggestWrapper.createEl("input", { 
      type: "text", 
      cls: "cmdr-input cmdr-icon-input",
      placeholder: t("modals.bind.icon.placeholder") 
    });
    
    const suggestContainer = suggestWrapper.createDiv({ cls: "cmdr-suggest-container" });
    suggestContainer.style.display = "none";
    
    // Update suggestions when input changes
    input.addEventListener("input", (e) => {
      this.iconSearchValue = (e.target as HTMLInputElement).value;
      this.updateIconSuggestions(suggestContainer);
      
      if (this.iconSearchValue) {
        suggestContainer.style.display = "block";
      } else {
        suggestContainer.style.display = "none";
      }
      this.clearError("icon", wrapper);
    });
    
    // Close suggestions when clicking outside
    document.addEventListener("click", (e) => {
      if (!suggestWrapper.contains(e.target as Node)) {
        suggestContainer.style.display = "none";
      }
    });
    
    // Initial suggestions
    this.updateIconSuggestions(suggestContainer);
    
    // Error container
    wrapper.createDiv({ cls: "cmdr-setting-error" });
  }

  private updateIconSuggestions(container: HTMLElement) {
    container.empty();
    
    this.filteredIcons = ICON_LIST.filter(icon => 
      icon.toLowerCase().includes(this.iconSearchValue.toLowerCase())
    ).slice(0, 10);
    
    if (this.filteredIcons.length === 0) {
      container.createDiv({ cls: "cmdr-empty-state", text: t("modals.bind.no_results") });
      return;
    }
    
    for (const icon of this.filteredIcons) {
      const item = container.createDiv({ cls: "cmdr-suggest-item" });
      
      const content = item.createDiv({ cls: "cmdr-suggest-item-content" });
      content.createDiv({ 
        cls: "cmdr-suggest-item-title", 
        text: icon.replace(/-/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()) 
      });
      
      const iconContainer = item.createDiv({ cls: "cmdr-suggest-item-icon" });
      setIcon(iconContainer, icon);
      
      item.addEventListener("click", () => {
        this.selectedIcon = icon;
        (container.parentElement?.querySelector("input") as HTMLInputElement).value = icon;
        container.style.display = "none";
      });
    }
  }

  private createTriggerModeField(container: HTMLElement) {
    const wrapper = container.createDiv({ cls: "cmdr-setting-item" });
    wrapper.createDiv({ cls: "cmdr-setting-item-name", text: t("modals.bind.trigger_mode.field") });
    
    const select = wrapper.createEl("select", { cls: "dropdown" });
    
    const options: TriggerMode[] = ["anywhere", "newline", "inline"];
    for (const option of options) {
      const optionEl = select.createEl("option", { 
        value: option,
        text: t(`bindings.trigger_mode.${option}`)
      });
      
      if (option === this.triggerMode) {
        optionEl.selected = true;
      }
    }
    
    select.addEventListener("change", () => {
      this.triggerMode = select.value as TriggerMode;
    });
  }

  private createDeviceModeField(container: HTMLElement) {
    const wrapper = container.createDiv({ cls: "cmdr-setting-item" });
    wrapper.createDiv({ cls: "cmdr-setting-item-name", text: t("modals.bind.device_mode.field") });
    
    const select = wrapper.createEl("select", { cls: "dropdown" });
    
    const options: DeviceMode[] = ["any", "desktop", "mobile"];
    for (const option of options) {
      const optionEl = select.createEl("option", { 
        value: option,
        text: t(`bindings.device_mode.${option}`)
      });
      
      if (option === this.deviceMode) {
        optionEl.selected = true;
      }
    }
    
    select.addEventListener("change", () => {
      this.deviceMode = select.value as DeviceMode;
    });
  }
  
  private setError(field: string, message: string, container: HTMLElement) {
    this.errors[field] = message;
    const errorEl = container.querySelector(".cmdr-setting-error") as HTMLElement;
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.addClass("active");
    }
  }
  
  private clearError(field: string, container: HTMLElement) {
    delete this.errors[field];
    const errorEl = container.querySelector(".cmdr-setting-error") as HTMLElement;
    if (errorEl) {
      errorEl.textContent = "";
      errorEl.removeClass("active");
    }
  }
  
  private clearAllErrors() {
    this.errors = {};
    this.contentEl.querySelectorAll(".cmdr-setting-error").forEach(el => {
      (el as HTMLElement).textContent = "";
      (el as HTMLElement).removeClass("active");
    });
  }

  private validateForm(): boolean {
    this.clearAllErrors();
    let isValid = true;
    
    // Validate command
    if (!this.selectedCommand) {
      const commandWrapper = this.contentEl.querySelectorAll(".cmdr-setting-item")[0] as HTMLElement;
      this.setError("command", t("modals.bind.command.required"), commandWrapper);
      isValid = false;
    }
    
    // Validate icon
    if (!this.selectedIcon) {
      const iconWrapper = this.contentEl.querySelectorAll(".cmdr-setting-item")[1] as HTMLElement;
      this.setError("icon", t("modals.bind.icon.required"), iconWrapper);
      isValid = false;
    }
    
    return isValid;
  }

  private saveNewCommand() {
    // Validate form
    if (!this.validateForm()) {
      return;
    }
    
    const name = this.name || this.selectedCommand!.name;
    
    const newCommand: SlashCommand = {
      id: this.selectedCommand!.id,
      icon: this.selectedIcon,
      name: name,
      mode: this.deviceMode,
      triggerMode: this.triggerMode
    };
    
    if (this.resolve) {
      this.resolve(newCommand);
      this.resolve = null;
      this.reject = null;
    }
    
    this.close();
  }
} 