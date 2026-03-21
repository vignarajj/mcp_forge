# MCP Forge

[![Tests](https://img.shields.io/badge/Tests-Passing-success.svg)](#testing)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

MCP Forge is a lightweight, purely local macOS desktop application (Apple Silicon only) that makes it easy to create, edit, manage, and switch between MCP (Model Context Protocol) profiles.

## Features

- **100% Local**: Everything is stored in local files. No cloud, no accounts, no telemetry.
- **Unlimited Profiles**: Create as many MCP profiles as you need.
- **Tool Support**: Assign profiles to Cursor, Claude Code, Antigravity, Qwen CLI, Gemini CLI, or Codex.
- **Visual Editor**: Edit MCP files with helpful UI controls (no raw JSON editing required).
- **Monochrome Theme**: Clean black/white native macOS look and feel.

---

## Installation

### Option 1: Homebrew (Recommended for macOS)

You can install MCP Forge directly via Homebrew using our custom tap:

```bash
brew tap yourusername/mcp-forge
brew install --cask mcp-forge
```

### Option 2: NPM (Global CLI)

You can also install the MCP Forge CLI globally via npm, which will launch the desktop application:

```bash
npm install -g mcp-forge
```

Once installed, simply run:
```bash
mcp-forge
```

---

## Development & Testing

This project is built with a modern, lightweight stack suitable for macOS. The UI is built with React and Tailwind CSS, designed to be wrapped in Tauri 2 or Electron for native distribution.

### Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/mcp-forge.git
   cd mcp-forge
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

### Testing

We use **Vitest** and **React Testing Library** for complete test coverage.

To run the test suite:
```bash
npm run test
```

To generate a test coverage report:
```bash
npm run coverage
```

---

## Publishing Guide (For Maintainers)

If you are forking or maintaining this repository, here is how you can publish your own releases to NPM and Homebrew.

### 1. Publishing to NPM

To make `npm install -g mcp-forge` work, you need to publish the package to the NPM registry.

1. **Update `package.json`**: Ensure your `package.json` has a `bin` field pointing to your CLI entry point (e.g., an Electron launcher or a script that opens the web UI).
   ```json
   "bin": {
     "mcp-forge": "./bin/cli.js"
   }
   ```
2. **Login to NPM**:
   ```bash
   npm login
   ```
3. **Publish**:
   ```bash
   npm publish
   ```

### 2. Publishing to Homebrew (Cask)

To allow users to run `brew install --cask mcp-forge`, you need to create a Homebrew Tap.

1. **Create a new GitHub repository** named `homebrew-mcp-forge` (or `homebrew-tap`).
2. **Create a Cask file** (`Casks/mcp-forge.rb`) in that repository:
   ```ruby
   cask "mcp-forge" do
     version "1.0.0"
     sha256 "INSERT_SHA256_HASH_OF_DMG_HERE"

     url "https://github.com/yourusername/mcp-forge/releases/download/v#{version}/MCP-Forge-mac-arm64.dmg"
     name "MCP Forge"
     desc "Local MCP Profile Manager"
     homepage "https://github.com/yourusername/mcp-forge"

     app "MCP Forge.app"

     zap trash: [
       "~/Library/Application Support/MCP Forge",
       "~/Library/Preferences/com.yourusername.mcpforge.plist",
     ]
   end
   ```
3. **Release your App**: Build your `.dmg` (e.g., via `npm run tauri build`), get its SHA256 hash (`shasum -a 256 app.dmg`), update the Ruby file, and upload the `.dmg` to your GitHub Releases.
4. **Users can now install it**:
   ```bash
   brew tap yourusername/mcp-forge
   brew install --cask mcp-forge
   ```

## Architecture

- **Frontend**: React 19, Vite, Tailwind CSS v4, Lucide React.
- **Testing**: Vitest, React Testing Library, JSDOM.
- **State Management**: LocalStorage (simulating local file system for the web prototype).
- **Styling**: Pure monochrome theme using Tailwind's utility classes.
