# MCP Forge

[![Tests](https://img.shields.io/badge/Tests-94%20Passing-success.svg)](#testing)
[![Coverage](https://img.shields.io/badge/Coverage-99%25-brightgreen.svg)](#testing)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A lightweight, 100% local profile manager for MCP (Model Context Protocol) configurations. Built for macOS (Apple Silicon).

---

## What is MCP Forge?

MCP Forge lets you **create, edit, manage, and switch between** MCP profiles for your AI coding tools — all from a single visual interface. No cloud accounts, no telemetry, no raw JSON editing.

### The Problem

Each AI coding tool (Cursor, Claude Code, Gemini CLI, etc.) uses its own MCP configuration file. Managing these across multiple projects means:
- Manually editing JSON config files per tool
- No way to share or reuse configurations across projects
- No visual way to see what rules, context folders, or ignore patterns you've set

### How MCP Forge Works

MCP Forge provides a **single UI** to manage all your MCP profiles:

1. **Profiles View** — The dashboard. Create, search, duplicate, delete, and switch between profiles. Each profile is tied to a specific tool (Cursor, Claude Code, etc.) and contains its own set of rules, context folders, and ignore patterns.

2. **Editor View** — Select any profile and edit it visually:
   - **Rules** — System-level instructions for the AI
   - **MCP Servers** — Add, edit, and remove MCP server entries with name, command, args, and environment variables
   - **Context Folders** — Directories the AI should have access to
   - **Ignore Patterns** — Files/folders the AI should skip
   - **Deploy** — Generate the tool-specific config (JSON or TOML), see validation status, and copy to clipboard with the exact target file path shown

3. **Tools View** — Overview of the 6 supported AI coding tools with per-tool profile counts and config file paths:
   - Cursor (`~/.cursor/mcp.json`), Claude Code (`~/.claude.json`), Gemini CLI (`~/.gemini/settings.json`), Codex (`~/.codex/config.toml`), Antigravity, Qwen CLI

4. **Settings View** — Storage info and data management. See real-time storage usage and clear all data with one click.

### Data Flow

```
User creates profile → adds MCP servers (name, command, args, env)
        ↓
Profile saved to browser LocalStorage
        ↓
Deploy tab generates tool-specific config (JSON or TOML)
        ↓
Validator checks structure: required fields, duplicates, npx -y flag, env vars
        ↓
User copies config → pastes into tool's config file (path shown in UI)
        ↓
AI tool reads the MCP configuration
```
All data stays on your machine. Nothing leaves the browser.

---

## Features

- **100% Local** — No cloud, no accounts, no telemetry. Everything is stored in browser LocalStorage.
- **Unlimited Profiles** — Create as many MCP profiles as you need for different projects and tools.
- **6 Tool Targets** — Assign profiles to Cursor, Claude Code, Antigravity, Qwen CLI, Gemini CLI, or Codex.
- **Visual MCP Server Editor** — Add/edit/remove MCP server entries with name, command, args, and env vars.
- **Auto-Format Config** — Generates the correct config format per tool (JSON for Cursor/Claude/Gemini, TOML for Codex).
- **Config Validation** — Real-time structural validation with error/warning indicators (missing fields, duplicate names, npx -y check, empty env values).
- **Deploy with File Paths** — Shows the exact config file path per tool and copy-to-clipboard for instant deployment.
- **Search & Filter** — Quickly find profiles by name.
- **Duplicate & Export** — Clone profiles or export them as `.mcp.json` files.
- **Monochrome Theme** — Clean black/white macOS-native look and feel.

---

## Architecture

```
src/
├── App.tsx                    # Root: view routing + state wiring
├── types.ts                   # TypeScript types (McpProfile, McpTool, ToolName, ValidationResult)
├── hooks/
│   └── useProfiles.ts         # Core state: CRUD operations, localStorage persistence
├── lib/
│   ├── toolConfigs.ts         # Tool config paths + JSON/TOML config generation
│   └── mcpValidator.ts        # MCP structural validation engine
├── components/
│   └── Sidebar.tsx            # Navigation sidebar (Profiles/Tools/Editor/Settings)
└── views/
    ├── ProfilesView.tsx       # Profile dashboard: list, search, create, delete, duplicate
    ├── EditorView.tsx         # Profile editor: rules, MCP servers, context, ignore, deploy
    ├── ToolsView.tsx          # Supported tools with profile counts and config paths
    └── SettingsView.tsx       # Storage info, clear data, privacy, version
```

**Stack**: React 19, Vite, Tailwind CSS v4, Lucide React, Vitest + React Testing Library

**State Management**: `useProfiles` hook persists all profiles to `localStorage` under the key `mcp-forge-profiles`. The active profile ID is stored separately under `mcp-forge-active-profile`.

---

## Testing

94 tests across 9 test files.

```bash
npm run test        # Run all tests
npm run coverage    # Run with coverage report
```

Test files mirror the source structure:
- `App.test.tsx` — View routing, sidebar navigation, edit-flow
- `useProfiles.test.ts` — All CRUD operations, localStorage persistence, edge cases
- `Sidebar.test.tsx` — Nav rendering, click handling, active state
- `ProfilesView.test.tsx` — Create, search, delete, duplicate, active state, tool selection
- `EditorView.test.tsx` — Tab switching, MCP server add/edit/remove, deploy validation, config output
- `ToolsView.test.tsx` — Tool rendering, profile counts, config file paths
- `SettingsView.test.tsx` — Storage display, clear data functionality
- `toolConfigs.test.ts` — Config path lookups, JSON generation, TOML generation, format selection
- `mcpValidator.test.ts` — All validation rules: required fields, duplicates, npx -y, env checks

---

## Installation

### Option 1: NPM (Global CLI)

```bash
npm install -g @vignaraj_rr/mcp-forge
```

Once installed, run:
```bash
mcp-forge
```

This will build the app (if needed), start a local preview server, and open it in your browser.

---

## Development Setup

### Prerequisites
- Node.js 18+
- npm 9+

### Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/vignarajj/mcp-forge.git
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
   The app will be available at `http://localhost:3000`.

### Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start Vite dev server on port 3000 |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run test` | Run all tests with Vitest |
| `npm run coverage` | Run tests with coverage report |
| `npm run lint` | TypeScript type checking |
| `npm run clean` | Remove `dist/` directory |

---

## License

MIT
