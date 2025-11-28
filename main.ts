import { App, Plugin, Modal, Notice, TFile, Setting, PluginSettingTab } from 'obsidian';

interface PropertyValueData {
    property: string;
    values: Set<string>;
    files: Map<string, TFile[]>;
}

interface PropertyValueManagerSettings {
    showRibbonIcon: boolean;
    enableDebugLogging: boolean;
    showModifiedFilesList: boolean;
    confirmBeforeDelete: boolean;
}

const DEFAULT_SETTINGS: PropertyValueManagerSettings = {
    showRibbonIcon: true,
    enableDebugLogging: false,
    showModifiedFilesList: true,
    confirmBeforeDelete: true
}

export default class PropertyValueManagerPlugin extends Plugin {
    settings: PropertyValueManagerSettings;
    ribbonIconEl: HTMLElement | null = null;

    async onload() {
        await this.loadSettings();

        // Add ribbon icon conditionally
        if (this.settings.showRibbonIcon) {
            this.addRibbonIconEl();
        }

        // Add command (always available)
        this.addCommand({
            id: 'manage-property-values',
            name: 'Manage multitext properties',
            callback: () => {
                new PropertyValueManagerModal(this.app, this.settings).open();
            }
        });

        // Add settings tab
        this.addSettingTab(new PropertyValueManagerSettingTab(this.app, this));

        if (this.settings.enableDebugLogging) {
            console.log('Property Value Manager plugin loaded');
        }
    }

    onunload() {
        if (this.settings.enableDebugLogging) {
            console.log('Property Value Manager plugin unloaded');
        }
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);

        // Update ribbon icon visibility
        if (this.settings.showRibbonIcon && !this.ribbonIconEl) {
            this.addRibbonIconEl();
        } else if (!this.settings.showRibbonIcon && this.ribbonIconEl) {
            this.ribbonIconEl.remove();
            this.ribbonIconEl = null;
        }
    }

    addRibbonIconEl() {
        this.ribbonIconEl = this.addRibbonIcon('list-checks', 'Manage Multitext Properties', () => {
            new PropertyValueManagerModal(this.app, this.settings).open();
        });
    }
}

class PropertyValueManagerSettingTab extends PluginSettingTab {
    plugin: PropertyValueManagerPlugin;

    constructor(app: App, plugin: PropertyValueManagerPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const {containerEl} = this;

        containerEl.empty();

        containerEl.createEl('h2', {text: 'Multitext Property Manager Settings'});

        new Setting(containerEl)
            .setName('Show ribbon icon')
            .setDesc('Display the plugin icon in the left sidebar')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.showRibbonIcon)
                .onChange(async (value) => {
                    this.plugin.settings.showRibbonIcon = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Enable debug logging')
            .setDesc('Show detailed debug information in the console (for troubleshooting)')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.enableDebugLogging)
                .onChange(async (value) => {
                    this.plugin.settings.enableDebugLogging = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Show modified files list')
            .setDesc('Display a list of files that were modified after deleting a property value')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.showModifiedFilesList)
                .onChange(async (value) => {
                    this.plugin.settings.showModifiedFilesList = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Confirm before delete')
            .setDesc('Show confirmation dialog before deleting property values')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.confirmBeforeDelete)
                .onChange(async (value) => {
                    this.plugin.settings.confirmBeforeDelete = value;
                    await this.plugin.saveSettings();
                }));
    }
}

class PropertyValueManagerModal extends Modal {
    propertyData: Map<string, PropertyValueData>;
    selectedProperty: string | null = null;
    settings: PropertyValueManagerSettings;

    constructor(app: App, settings: PropertyValueManagerSettings) {
        super(app);
        this.propertyData = new Map();
        this.settings = settings;
    }

    async onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('property-value-manager-modal');

        contentEl.createEl('h2', { text: 'Multitext Property Manager' });

        // Scan vault for properties
        const loadingEl = contentEl.createEl('p', { text: 'Scanning vault for multitext properties...' });

        await this.scanVaultProperties();

        loadingEl.remove();

        if (this.propertyData.size === 0) {
            contentEl.createEl('p', { text: 'No multitext properties found in vault.' });
            return;
        }

        this.renderPropertyList();
    }

    async scanVaultProperties() {
        const files = this.app.vault.getMarkdownFiles();

        if (this.settings.enableDebugLogging) {
            console.log('Property Value Manager: Scanning vault...');
            console.log('Total files:', files.length);
        }

        // Read types.json to find multitext properties
        const multitextProperties = new Set<string>();
        try {
            // Try to read types.json directly using the adapter
            const configDir = (this.app.vault.adapter as any).getBasePath
                ? (this.app.vault.adapter as any).getBasePath()
                : this.app.vault.adapter.getResourcePath('');

            if (this.settings.enableDebugLogging) {
                console.log('Vault config dir:', configDir);
                console.log('Reading from path:', this.app.vault.configDir + '/types.json');
            }

            // Read directly from the file system
            const typesPath = this.app.vault.configDir + '/types.json';
            const typesContent = await this.app.vault.adapter.read(typesPath);
            const typesData = JSON.parse(typesContent);

            if (this.settings.enableDebugLogging) {
                console.log('Loaded types.json successfully');
                console.log('Types data:', typesData);
            }

            if (typesData.types) {
                if (this.settings.enableDebugLogging) {
                    console.log('Types object:', typesData.types);
                }
                for (const [propName, propType] of Object.entries(typesData.types)) {
                    if (this.settings.enableDebugLogging) {
                        console.log(`  Property: ${propName}, Type: ${propType}`);
                    }
                    if (propType === 'multitext') {
                        multitextProperties.add(propName);
                        if (this.settings.enableDebugLogging) {
                            console.log(`    -> Added ${propName} as multitext`);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error reading types.json:', error);
        }

        if (this.settings.enableDebugLogging) {
            console.log('Multitext properties from types.json:', Array.from(multitextProperties));
        }

        // Scan files but only for multitext properties
        for (const file of files) {
            const cache = this.app.metadataCache.getFileCache(file);
            if (!cache?.frontmatter) continue;

            for (const [key, value] of Object.entries(cache.frontmatter)) {
                // Only process properties explicitly marked as multitext
                if (!multitextProperties.has(key)) continue;

                // Skip null/undefined values
                if (value === null || value === undefined) continue;

                // Initialize property data if not exists
                if (!this.propertyData.has(key)) {
                    this.propertyData.set(key, {
                        property: key,
                        values: new Set(),
                        files: new Map()
                    });
                }

                const propData = this.propertyData.get(key)!;

                // Handle array values
                let values = Array.isArray(value) ? value : [value];

                // Filter out null/undefined and convert to strings
                values = values.filter(v => v !== null && v !== undefined);

                for (const val of values) {
                    const stringVal = String(val);
                    propData.values.add(stringVal);

                    if (!propData.files.has(stringVal)) {
                        propData.files.set(stringVal, []);
                    }
                    propData.files.get(stringVal)!.push(file);
                }
            }
        }

        if (this.settings.enableDebugLogging) {
            console.log(`Found ${this.propertyData.size} multitext properties with values`);

            // Log Status specifically
            const statusData = this.propertyData.get('Status');
            if (statusData) {
                console.log('Status property found!');
                console.log(`  Values (${statusData.values.size}):`, Array.from(statusData.values).sort());
            } else {
                console.log('Status property NOT found - check if it exists in types.json');
            }
        }
    }

    renderPropertyList() {
        const { contentEl } = this;

        // Clear previous content except the title
        const existingContainer = contentEl.querySelector('.property-container');
        if (existingContainer) existingContainer.remove();

        // Create new container
        const container = contentEl.createDiv({ cls: 'property-container' });

        // Property selector
        const selectorDiv = container.createDiv({ cls: 'property-selector' });
        selectorDiv.createEl('h3', { text: 'Select a property:' });

        const propertyList = selectorDiv.createDiv({ cls: 'property-list' });

        // Sort properties alphabetically for consistency
        const sortedProperties = Array.from(this.propertyData.entries()).sort((a, b) =>
            a[0].localeCompare(b[0])
        );

        for (const [propName, propData] of sortedProperties) {
            const propItem = propertyList.createDiv({ cls: 'property-item' });

            // Re-select if it was previously selected
            if (propName === this.selectedProperty) {
                propItem.addClass('selected');
            }

            propItem.createEl('strong', { text: propName });
            propItem.createEl('span', { text: ` (${propData.values.size} values)`, cls: 'property-count' });

            propItem.addEventListener('click', () => {
                // Remove previous selection
                propertyList.querySelectorAll('.property-item').forEach(el => el.removeClass('selected'));
                propItem.addClass('selected');

                this.selectedProperty = propName;
                this.renderPropertyValues(propData);
            });
        }

        // If a property was selected, re-render its values
        if (this.selectedProperty && this.propertyData.has(this.selectedProperty)) {
            this.renderPropertyValues(this.propertyData.get(this.selectedProperty)!);
        }
    }

    renderPropertyValues(propData: PropertyValueData) {
        const { contentEl } = this;

        // Remove existing values container
        const existingValuesContainer = contentEl.querySelector('.values-container');
        if (existingValuesContainer) existingValuesContainer.remove();

        const valuesContainer = contentEl.createDiv({ cls: 'values-container' });
        valuesContainer.createEl('h3', { text: `Values for "${propData.property}":` });

        const valuesList = valuesContainer.createDiv({ cls: 'values-list' });

        // Always sort values alphabetically
        const sortedValues = Array.from(propData.values).sort((a, b) => a.localeCompare(b));

        for (const value of sortedValues) {
            const valueItem = valuesList.createDiv({ cls: 'value-item' });

            const valueText = valueItem.createDiv({ cls: 'value-text' });
            valueText.createEl('span', { text: value });

            const fileCount = propData.files.get(value)?.length || 0;

            // Show "orphaned" for values with no files
            const countText = fileCount === 0
                ? ' (0 files - orphaned)'
                : ` (${fileCount} file${fileCount !== 1 ? 's' : ''})`;

            valueText.createEl('span', {
                text: countText,
                cls: fileCount === 0 ? 'value-count orphaned' : 'value-count'
            });

            const deleteBtn = valueItem.createEl('button', {
                text: '×',
                cls: 'value-delete-btn'
            });

            deleteBtn.addEventListener('click', async () => {
                await this.deletePropertyValue(propData.property, value, fileCount);
            });
        }
    }

    async deletePropertyValue(property: string, value: string, fileCount: number) {
        const propData = this.propertyData.get(property);
        if (!propData) return;

        const files = propData.files.get(value) || [];

        // Confirm deletion (if setting is enabled)
        if (this.settings.confirmBeforeDelete) {
            const confirmed = await this.confirmDeletion(property, value, fileCount);
            if (!confirmed) return;
        }

        if (fileCount === 0) {
            // Orphaned value - just remove from our display
            new Notice(`Removing orphaned value "${value}" from metadata`);

            // Clear the value from Obsidian's property cache by triggering a metadata update
            // This will happen automatically on next vault reload, or we can manually clear it
            propData.values.delete(value);
            propData.files.delete(value);

            // Update display
            this.renderPropertyList();
            new Notice(`Removed orphaned value "${value}"`);
            return;
        }

        new Notice(`Removing "${value}" from ${fileCount} file(s)...`);

        let updatedCount = 0;
        const modifiedFiles: TFile[] = [];

        for (const file of files) {
            try {
                await this.removeValueFromFile(file, property, value);
                updatedCount++;
                modifiedFiles.push(file);
            } catch (error) {
                console.error(`Error updating file ${file.path}:`, error);
            }
        }

        new Notice(`Successfully removed "${value}" from ${updatedCount} file(s)`);

        // Show modified files list if setting is enabled
        if (this.settings.showModifiedFilesList && modifiedFiles.length > 0) {
            new ModifiedFilesModal(this.app, modifiedFiles, property, value).open();
        }

        // Re-scan and update display
        this.propertyData.clear();
        await this.scanVaultProperties();

        // Keep the same property selected and re-render
        this.renderPropertyList();
    }

    async confirmDeletion(property: string, value: string, fileCount: number): Promise<boolean> {
        return new Promise((resolve) => {
            const modal = new Modal(this.app);
            modal.contentEl.createEl('h3', { text: 'Confirm Deletion' });

            if (fileCount === 0) {
                modal.contentEl.createEl('p', {
                    text: `Remove orphaned value "${value}" from the "${property}" property?`
                });
                modal.contentEl.createEl('p', {
                    text: 'This value exists in Obsidian\'s metadata but is not used in any files. Removing it will clean up your property dropdown suggestions.',
                    cls: 'mod-info'
                });
            } else {
                modal.contentEl.createEl('p', {
                    text: `Are you sure you want to remove "${value}" from the "${property}" property in ${fileCount} file(s)?`
                });
                modal.contentEl.createEl('p', {
                    text: 'This action cannot be undone.',
                    cls: 'mod-warning'
                });
            }

            const buttonContainer = modal.contentEl.createDiv({ cls: 'modal-button-container' });

            const cancelBtn = buttonContainer.createEl('button', { text: 'Cancel' });
            cancelBtn.addEventListener('click', () => {
                modal.close();
                resolve(false);
            });

            const confirmBtn = buttonContainer.createEl('button', {
                text: fileCount === 0 ? 'Remove' : 'Delete',
                cls: 'mod-warning'
            });
            confirmBtn.addEventListener('click', () => {
                modal.close();
                resolve(true);
            });

            modal.open();
        });
    }

    async removeValueFromFile(file: TFile, property: string, valueToRemove: string) {
        const content = await this.app.vault.read(file);
        const lines = content.split('\n');

        let inFrontmatter = false;
        let frontmatterStart = -1;
        let frontmatterEnd = -1;
        let propertyLineIndex = -1;
        let isMultilineProperty = false;
        let propertyIndent = '';

        // Find frontmatter boundaries and property location
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            if (line.trim() === '---') {
                if (!inFrontmatter) {
                    inFrontmatter = true;
                    frontmatterStart = i;
                } else {
                    frontmatterEnd = i;
                    break;
                }
                continue;
            }

            if (inFrontmatter) {
                // Check if this line starts the property
                const propertyMatch = line.match(/^(\s*)([^:]+):\s*(.*)$/);
                if (propertyMatch && propertyMatch[2].trim() === property) {
                    propertyLineIndex = i;
                    propertyIndent = propertyMatch[1];
                    const valueContent = propertyMatch[3].trim();

                    // Check if it's a multiline array or single line
                    if (valueContent === '' || valueContent === '[' || valueContent === '|') {
                        isMultilineProperty = true;
                    } else {
                        // Single line property
                        isMultilineProperty = false;
                    }
                }
            }
        }

        if (propertyLineIndex === -1) return;

        if (isMultilineProperty) {
            // Handle multiline array property
            const valuesToKeep: string[] = [];
            let i = propertyLineIndex + 1;

            while (i < frontmatterEnd) {
                const line = lines[i];
                const trimmed = line.trim();

                // Check if this is a list item
                if (trimmed.startsWith('-')) {
                    const val = trimmed.substring(1).trim();
                    if (val !== valueToRemove) {
                        valuesToKeep.push(line);
                    }
                    i++;
                } else if (trimmed === '' || !line.startsWith(propertyIndent + ' ')) {
                    // End of this property
                    break;
                } else {
                    i++;
                }
            }

            // Remove old property lines
            const numLinesToRemove = i - propertyLineIndex;
            lines.splice(propertyLineIndex, numLinesToRemove);

            // Re-add property with remaining values
            if (valuesToKeep.length > 0) {
                const newLines = [lines[propertyLineIndex - (numLinesToRemove - 1)] || `${propertyIndent}${property}:`];
                newLines.push(...valuesToKeep);
                lines.splice(propertyLineIndex, 0, ...newLines.slice(1));
            }
        } else {
            // Handle single-line property (could be single value or inline array)
            const line = lines[propertyLineIndex];
            const match = line.match(/^(\s*)([^:]+):\s*(.*)$/);

            if (match) {
                const indent = match[1];
                const propName = match[2];
                let valueContent = match[3].trim();

                // Check if it's an inline array [val1, val2, val3]
                if (valueContent.startsWith('[') && valueContent.endsWith(']')) {
                    const arrayContent = valueContent.substring(1, valueContent.length - 1);
                    const values = arrayContent.split(',').map(v => v.trim()).filter(v => v !== '');
                    const filteredValues = values.filter(v => v !== valueToRemove && v !== `"${valueToRemove}"` && v !== `'${valueToRemove}'`);

                    if (filteredValues.length > 0) {
                        lines[propertyLineIndex] = `${indent}${propName}: [${filteredValues.join(', ')}]`;
                    } else {
                        // Remove the property entirely if no values left
                        lines.splice(propertyLineIndex, 1);
                    }
                } else if (valueContent === valueToRemove) {
                    // Single value that matches - remove the entire property
                    lines.splice(propertyLineIndex, 1);
                }
            }
        }

        const newContent = lines.join('\n');
        await this.app.vault.modify(file, newContent);
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

class ModifiedFilesModal extends Modal {
    files: TFile[];
    property: string;
    value: string;

    constructor(app: App, files: TFile[], property: string, value: string) {
        super(app);
        this.files = files;
        this.property = property;
        this.value = value;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('modified-files-modal');

        contentEl.createEl('h2', { text: 'Modified Files' });

        contentEl.createEl('p', {
            text: `Removed "${this.value}" from "${this.property}" in ${this.files.length} file(s):`
        });

        const filesList = contentEl.createDiv({ cls: 'modified-files-list' });

        for (const file of this.files) {
            const fileItem = filesList.createDiv({ cls: 'modified-file-item' });

            // Create clickable link to the file
            const link = fileItem.createEl('a', {
                text: file.path,
                cls: 'modified-file-link'
            });

            link.addEventListener('click', async (e) => {
                e.preventDefault();
                await this.app.workspace.getLeaf().openFile(file);
                this.close();
            });
        }

        // Add close button
        const buttonContainer = contentEl.createDiv({ cls: 'modal-button-container' });
        const closeBtn = buttonContainer.createEl('button', { text: 'Close' });
        closeBtn.addEventListener('click', () => this.close());
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
