import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ToolsView } from './ToolsView';
import { McpProfile } from '../types';

function createMockProfile(overrides: Partial<McpProfile> = {}): McpProfile {
  return {
    id: crypto.randomUUID(),
    name: 'Test Profile',
    tool: 'Cursor',
    rules: [],
    tools: [],
    contextFolders: [],
    ignorePatterns: [],
    projectSettings: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  };
}

function defaultProps(overrides = {}) {
  return {
    profiles: [] as McpProfile[],
    activeProfileId: null as string | null,
    setActiveProfileId: vi.fn(),
    addProfile: vi.fn(),
    updateProfile: vi.fn(),
    deleteProfile: vi.fn(),
    duplicateProfile: vi.fn(),
    loaded: true,
    ...overrides,
  };
}

describe('ToolsView', () => {
  it('renders the header', () => {
    render(<ToolsView {...defaultProps()} />);
    expect(screen.getByText('Supported Tools')).toBeInTheDocument();
    expect(screen.getByText('AI coding environments that support MCP')).toBeInTheDocument();
  });

  it('renders all 6 supported tools', () => {
    render(<ToolsView {...defaultProps()} />);
    expect(screen.getByText('Cursor')).toBeInTheDocument();
    expect(screen.getByText('Claude Code')).toBeInTheDocument();
    expect(screen.getByText('Antigravity')).toBeInTheDocument();
    expect(screen.getByText('Qwen CLI')).toBeInTheDocument();
    expect(screen.getByText('Gemini CLI')).toBeInTheDocument();
    expect(screen.getByText('Codex')).toBeInTheDocument();
  });

  it('shows tool descriptions', () => {
    render(<ToolsView {...defaultProps()} />);
    expect(screen.getByText('The AI-first Code Editor')).toBeInTheDocument();
    expect(screen.getByText("Anthropic's CLI coding assistant")).toBeInTheDocument();
    expect(screen.getByText('Next-gen coding harness')).toBeInTheDocument();
    expect(screen.getByText("Alibaba's powerful local models")).toBeInTheDocument();
    expect(screen.getByText("Google's multimodal coding agent")).toBeInTheDocument();
    expect(screen.getByText("OpenAI's original code model")).toBeInTheDocument();
  });

  it('displays correct profile counts per tool', () => {
    const profiles = [
      createMockProfile({ tool: 'Cursor' }),
      createMockProfile({ tool: 'Cursor' }),
      createMockProfile({ tool: 'Claude Code' }),
    ];
    render(<ToolsView {...defaultProps({ profiles })} />);

    expect(screen.getByText('2 Profiles')).toBeInTheDocument();
    expect(screen.getByText('1 Profiles')).toBeInTheDocument();
    // The rest should show 0
    expect(screen.getAllByText('0 Profiles').length).toBe(4);
  });

  it('displays config file paths for each tool', () => {
    render(<ToolsView {...defaultProps()} />);
    expect(screen.getByTestId('path-cursor').textContent).toBe('~/.cursor/mcp.json');
    expect(screen.getByTestId('path-codex').textContent).toBe('~/.codex/config.toml');
    expect(screen.getByTestId('path-gemini').textContent).toBe('~/.gemini/settings.json');
  });
});
