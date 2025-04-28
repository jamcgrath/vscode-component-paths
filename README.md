# Component Reference Finder

Quickly find all references to a component file in your workspace and copy their relative paths to your clipboard.

## Features

- **Cross-file search**  
  Scans JavaScript, TypeScript, Vue, and Svelte files for exact matches of a component’s base name.
- **Explorer context menu**  
  Right-click any `.js|.jsx|.ts|.tsx|.vue|.svelte` file and select **Find All Component References**.
- **Command Palette**  
  Invoke **Find All Component References** from the palette (`Ctrl+Shift+P` / `Cmd+Shift+P`).
- **Quick-pick & copy**  
  Choose one or more matching files from the list and have their relative paths automatically copied to your clipboard.
- **Lightweight & zero-config**  
  No additional settings or configuration required.

## Requirements

- Visual Studio Code **1.99.0** or newer
- For development/debugging, enable the proposed API `findTextInFiles` (see **Known Issues** below)

## Usage

1. **Open Explorer** and locate the component file you want to analyze (e.g. `Button.vue`).
2. **Right-click** the file and choose **Find All Component References**, or run the command from the palette.
3. A quick-pick list of all files containing that component name appears.
4. Select one or more entries and press **Enter**.
5. The selected relative paths are now on your clipboard. Paste anywhere you need them!

## Extension Settings

This extension does **not** contribute any user-configurable settings.

## Known Issues

- Internally uses the proposed VS Code API `findTextInFiles`. When debugging locally, add this to your `.vscode/launch.json`:
  ```jsonc
  "args": [
    "--extensionDevelopmentPath=${workspaceFolder}",
    "--enable-proposed-api",
    "yourPublisher.component-reference-finder"
  ]
  ```
- Future releases will migrate off the proposed API once it becomes stable.

## Release Notes

### 1.1.0

- Added support for Svelte files (`.svelte`).

### 1.0.0

- Initial release: search & copy references for JS/TS/Vue components.

---

Enjoy using Component Reference Finder! Feel free to file issues or pull requests at the [GitHub repository](https://github.com/yourPublisher/component-reference-finder).
whe
