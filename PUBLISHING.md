# Publishing to GitHub

## Initial Setup

1. **Create a new GitHub repository**
   ```bash
   # Navigate to the plugin directory
   cd /mnt/e/Users/Steve/Data/Notes/Personal/.obsidian/plugins/property-value-manager

   # Initialize git
   git init

   # Add all files
   git add .

   # Create initial commit
   git commit -m "Initial commit: Property Value Manager plugin v1.0.0"
   ```

2. **Create GitHub repository**
   - Go to GitHub and create a new repository named `obsidian-property-value-manager`
   - Don't initialize with README (we already have one)

3. **Push to GitHub**
   ```bash
   # Add remote
   git remote add origin https://github.com/YOUR_USERNAME/obsidian-property-value-manager.git

   # Push to main branch
   git branch -M main
   git push -u origin main
   ```

## Creating a Release

1. **Update manifest.json** with your GitHub username:
   ```json
   "authorUrl": "https://github.com/YOUR_USERNAME"
   ```

2. **Create a release on GitHub**
   - Go to your repository on GitHub
   - Click "Releases" → "Create a new release"
   - Tag: `1.0.0`
   - Title: `Property Value Manager v1.0.0`
   - Description: Copy from README.md features section
   - **Important**: Attach these files to the release:
     - `main.js`
     - `manifest.json`
     - `styles.css`

## Submitting to Obsidian Community Plugins

1. **Fork the Obsidian Releases repository**
   - Go to https://github.com/obsidianmd/obsidian-releases
   - Click "Fork"

2. **Add your plugin**
   - In your fork, edit `community-plugins.json`
   - Add entry for your plugin:
   ```json
   {
     "id": "property-value-manager",
     "name": "Property Value Manager",
     "author": "Steve Klingele",
     "description": "Manage and delete unused property values from list-type properties in the All Properties view",
     "repo": "YOUR_USERNAME/obsidian-property-value-manager"
   }
   ```

3. **Create Pull Request**
   - Create a PR to the main obsidian-releases repository
   - Wait for review and approval

## Files Included in Release

- ✅ `main.js` - Compiled plugin code
- ✅ `manifest.json` - Plugin metadata
- ✅ `styles.css` - Plugin styles
- ✅ `README.md` - Documentation
- ✅ `versions.json` - Version compatibility
- ❌ Source files (main.ts, etc.) - Only in repository, not in release

## .gitignore

The following files are excluded from git:
- `node_modules/` - Dependencies
- `main.js` - Built file (included in releases only)
- `*.js.map` - Source maps

## Development Workflow

```bash
# Install dependencies
npm install

# Development mode (watches for changes)
npm run dev

# Build for production
npm run build

# Commit changes
git add .
git commit -m "Description of changes"
git push
```

## Version Updates

1. Update version in `manifest.json`
2. Run `npm run version` to update versions.json
3. Commit changes
4. Create new GitHub release with updated files
