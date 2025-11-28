# Multitext Property Manager for Obsidian

A powerful Obsidian plugin that helps you manage and clean up values from multitext (list-type) properties across your entire vault.

![Obsidian Plugin](https://img.shields.io/badge/Obsidian-Plugin-purple)
![Version](https://img.shields.io/badge/version-1.1.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## Overview

Multitext Property Manager solves a common problem in Obsidian: cleaning up property values that you no longer want to use. When you have properties like `Status`, `Priority`, or `Category` with predefined values, this plugin makes it easy to remove specific values across all your notes with just a few clicks.

## What are Multitext Properties?

Multitext properties are properties in Obsidian that can have multiple predefined values. They're defined in your `.obsidian/types.json` file with type `"multitext"`. Common examples include:

- **Status**: Active, Completed, Archived, etc.
- **Priority**: High, Medium, Low
- **Category**: Personal, Work, Project, etc.

## Features

- ✅ **View all multitext properties** in your vault
- ✅ **See all values** used for each property (automatically sorted alphabetically)
- ✅ **Delete specific values** from properties across your entire vault
- ✅ **Track usage** - Shows how many files use each value
- ✅ **Identify orphaned values** - Values that exist in Obsidian's cache but aren't used in any files
- ✅ **Review changes** - Clickable list of modified files after deletion
- ✅ **Configurable** - Settings for behavior and display preferences

## Installation

### From Obsidian Community Plugins (Recommended - Coming Soon)

1. Open **Settings** in Obsidian
2. Navigate to **Community Plugins**
3. Click **Browse** and search for "Multitext Property Manager"
4. Click **Install**, then **Enable**

### Manual Installation

1. Download the latest release from [GitHub Releases](https://github.com/yourusername/obsidian-multitext-property-manager/releases)
2. Extract the files to your vault's plugins folder: `<vault>/.obsidian/plugins/property-value-manager/`
3. Reload Obsidian
4. Enable the plugin in **Settings → Community Plugins**

### Build from Source

```bash
# Clone the repository
git clone https://github.com/yourusername/obsidian-multitext-property-manager.git
cd obsidian-multitext-property-manager

# Install dependencies
npm install

# Build the plugin
npm run build

# Copy to your vault
cp main.js manifest.json styles.css <your-vault>/.obsidian/plugins/property-value-manager/
```

## Usage

### Basic Workflow

1. **Open the plugin**:
   - Click the checklist icon in the left sidebar ribbon, or
   - Use Command Palette (`Ctrl/Cmd + P`) → "Manage multitext properties"

2. **Select a property** from the list (e.g., "Status")

3. **View all values** for that property (sorted alphabetically)

4. **Click the × button** next to any value to delete it

5. **Confirm deletion** (if enabled in settings)

6. **Review modified files** - A modal will show all files that were changed

### Example Use Case

Let's say you have a `Status` property with these values:
- `2 In Progress` (old naming scheme)
- `4 Completed` (old naming scheme)
- `Active` (new naming scheme)
- `Completed` (new naming scheme)

You want to remove the old values:
1. Open Multitext Property Manager
2. Select "Status" property
3. Click × next to "2 In Progress" → Confirm
4. Click × next to "4 Completed" → Confirm
5. Done! The old values are removed from all files and won't appear in dropdowns anymore

## Settings

Access settings via **Settings → Multitext Property Manager**:

| Setting | Description | Default |
|---------|-------------|---------|
| **Show ribbon icon** | Display the plugin icon in the left sidebar | ✅ Enabled |
| **Enable debug logging** | Show detailed debug information in the console for troubleshooting | ❌ Disabled |
| **Show modified files list** | Display a clickable list of files that were modified after deleting a property value | ✅ Enabled |
| **Confirm before delete** | Show confirmation dialog before deleting property values | ✅ Enabled |

## How It Works

1. **Scans your vault** - Reads `.obsidian/types.json` to find properties marked as `"multitext"`
2. **Analyzes usage** - Scans all markdown files to find which values are actually used
3. **Identifies orphans** - Detects values that exist in Obsidian's cache but aren't in any files
4. **Safe deletion** - Only modifies frontmatter properties, preserving all other content
5. **Tracks changes** - Shows you exactly which files were modified

## Technical Details

### Property Types Supported

Only properties explicitly defined as `"multitext"` in `.obsidian/types.json` are shown. For example:

```json
{
  "types": {
    "Status": "multitext",
    "Priority": "multitext",
    "Category": "multitext"
  }
}
```

### File Handling

- Handles both YAML-style multiline arrays and inline arrays
- Preserves frontmatter formatting
- Safe deletion with no data loss
- Works with all valid YAML property formats

## Development

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Obsidian (for testing)

### Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/obsidian-multitext-property-manager.git
cd obsidian-multitext-property-manager

# Install dependencies
npm install

# Start development mode (watches for changes)
npm run dev

# Build for production
npm run build
```

### Project Structure

```
property-value-manager/
├── main.ts              # Main plugin code
├── styles.css           # Plugin styles
├── manifest.json        # Plugin metadata
├── versions.json        # Version compatibility
├── package.json         # npm configuration
├── tsconfig.json        # TypeScript configuration
├── esbuild.config.mjs   # Build configuration
└── README.md           # This file
```

### Testing

1. Build the plugin: `npm run build`
2. Copy files to your test vault: `cp main.js manifest.json styles.css <test-vault>/.obsidian/plugins/property-value-manager/`
3. Reload Obsidian
4. Test the plugin functionality

## Troubleshooting

### No properties showing up?

- Check that your properties are defined as `"multitext"` in `.obsidian/types.json`
- Enable "Debug logging" in settings and check the console for errors

### Values not being deleted?

- Ensure you have write permissions to your vault files
- Check the console for error messages
- Make sure the files aren't open in an external editor

### Plugin not loading?

- Verify all three files are present: `main.js`, `manifest.json`, `styles.css`
- Check Obsidian version (requires 1.4.0+)
- Look for errors in the developer console (Ctrl/Cmd + Shift + I)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Changelog

### Version 1.1.0 (2025-01-28)
- Renamed to "Multitext Property Manager" for clarity
- Removed alphabetical sort setting (now always enabled)
- Added modified files list modal
- Improved settings configuration
- Enhanced UI messaging

### Version 1.0.0 (2025-01-28)
- Initial release
- Basic property value management
- Orphaned value detection
- Configurable settings

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you encounter any issues or have suggestions:

- 🐛 [Report a bug](https://github.com/yourusername/obsidian-multitext-property-manager/issues)
- 💡 [Request a feature](https://github.com/yourusername/obsidian-multitext-property-manager/issues)
- 💬 [Ask a question](https://github.com/yourusername/obsidian-multitext-property-manager/discussions)

## Acknowledgments

- Built with the [Obsidian API](https://github.com/obsidianmd/obsidian-api)
- Inspired by the need to clean up property values in large vaults
- Thanks to the Obsidian community for feedback and support

---

**Made with ❤️ for the Obsidian community**
