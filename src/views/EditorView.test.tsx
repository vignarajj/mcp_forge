import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EditorView } from './EditorView';
import { McpProfile } from '../types';

// ─── Mock lib modules ────────────────────────────────────────────────────────
vi.mock('../lib/apiClient', () => ({
  isApiAvailable: vi.fn(),
  writeConfigToFile: vi.fn(),
}));

vi.mock('../lib/mcpDiscovery', () => ({
  discoverMcpTools: vi.fn(),
}));

import { isApiAvailable, writeConfigToFile } from '../lib/apiClient';
import { discoverMcpTools } from '../lib/mcpDiscovery';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function createMockProfile(overrides: Partial<McpProfile> = {}): McpProfile {
  return {
    id: 'profile-1',
    name: 'Test Profile',
    tool: 'Cursor',
    rules: ['Rule 1', 'Rule 2'],
    tools: [],
    contextFolders: ['/src'],
    ignorePatterns: ['node_modules/'],
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

// ─── Tests ───────────────────────────────────────────────────────────────────
describe('EditorView', () => {
  beforeEach(() => {
    vi.mocked(isApiAvailable).mockResolvedValue(false);
    vi.mocked(writeConfigToFile).mockResolvedValue({ ok: true });
    vi.mocked(discoverMcpTools).mockResolvedValue({ ok: true, tools: [] });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  // ── Original tests (preserved) ──────────────────────────────────────────

  it('shows the no-profile-selected state when no profile is active', () => {
    render(<EditorView {...defaultProps()} />);
    expect(screen.getByText('No Profile Selected')).toBeInTheDocument();
    expect(screen.getByText('Select a profile from the Profiles view to edit.')).toBeInTheDocument();
  });

  it('renders the editor when an active profile exists', () => {
    const profile = createMockProfile();
    render(<EditorView {...defaultProps({ profiles: [profile], activeProfileId: profile.id })} />);
    expect(screen.getByText('Test Profile')).toBeInTheDocument();
    expect(screen.getByText('Cursor')).toBeInTheDocument();
    expect(screen.getByText('Editing MCP configuration')).toBeInTheDocument();
  });

  it('renders the Rules tab by default with existing rules', () => {
    const profile = createMockProfile({ rules: ['Always use TypeScript'] });
    render(<EditorView {...defaultProps({ profiles: [profile], activeProfileId: profile.id })} />);
    expect(screen.getByText('System Rules')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Always use TypeScript')).toBeInTheDocument();
  });

  it('switches to the Context Folders tab', () => {
    const profile = createMockProfile({ contextFolders: ['/src/components'] });
    render(<EditorView {...defaultProps({ profiles: [profile], activeProfileId: profile.id })} />);
    fireEvent.click(screen.getByText('Context Folders'));
    expect(screen.getByDisplayValue('/src/components')).toBeInTheDocument();
  });

  it('switches to the Ignore Patterns tab', () => {
    const profile = createMockProfile({ ignorePatterns: ['*.log'] });
    render(<EditorView {...defaultProps({ profiles: [profile], activeProfileId: profile.id })} />);
    fireEvent.click(screen.getByText('Ignore Patterns'));
    expect(screen.getByDisplayValue('*.log')).toBeInTheDocument();
  });

  it('switches to the MCP Servers tab and shows Add MCP Server button', () => {
    const profile = createMockProfile();
    render(<EditorView {...defaultProps({ profiles: [profile], activeProfileId: profile.id })} />);
    fireEvent.click(screen.getByText('MCP Servers'));
    expect(screen.getByText('Add MCP Server')).toBeInTheDocument();
  });

  it('adds a new item to the rules list', () => {
    const profile = createMockProfile({ rules: [] });
    render(<EditorView {...defaultProps({ profiles: [profile], activeProfileId: profile.id })} />);
    fireEvent.click(screen.getByText('Add Item'));
    const textareas = screen.getAllByRole('textbox');
    expect(textareas.length).toBe(1);
  });

  it('calls updateProfile with filtered data on save', () => {
    const updateProfile = vi.fn();
    const profile = createMockProfile({ rules: ['Keep this', ''], contextFolders: ['/src', ''], ignorePatterns: ['*.log', ''] });
    render(<EditorView {...defaultProps({ profiles: [profile], activeProfileId: profile.id, updateProfile })} />);
    fireEvent.click(screen.getByText('Save Changes'));
    expect(updateProfile).toHaveBeenCalledWith(profile.id, {
      rules: ['Keep this'],
      contextFolders: ['/src'],
      ignorePatterns: ['*.log'],
      tools: [],
    });
  });

  it('renders Export JSON button', () => {
    const profile = createMockProfile();
    render(<EditorView {...defaultProps({ profiles: [profile], activeProfileId: profile.id })} />);
    expect(screen.getByText('Export JSON')).toBeInTheDocument();
  });

  it('removes an item from the rules list when clicking the delete button', () => {
    const profile = createMockProfile({ rules: ['Rule A', 'Rule B'] });
    render(<EditorView {...defaultProps({ profiles: [profile], activeProfileId: profile.id })} />);
    expect(screen.getByDisplayValue('Rule A')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Rule B')).toBeInTheDocument();

    const deleteButtons = screen.getAllByRole('button').filter(btn => {
      const svg = btn.querySelector('svg');
      return svg && btn.closest('.flex.items-start');
    });
    fireEvent.click(deleteButtons[0]);

    expect(screen.queryByDisplayValue('Rule A')).not.toBeInTheDocument();
    expect(screen.getByDisplayValue('Rule B')).toBeInTheDocument();
  });

  it('edits a textarea value in the rules list', () => {
    const profile = createMockProfile({ rules: ['Original rule'] });
    render(<EditorView {...defaultProps({ profiles: [profile], activeProfileId: profile.id })} />);
    const textarea = screen.getByDisplayValue('Original rule');
    fireEvent.change(textarea, { target: { value: 'Modified rule' } });
    expect(screen.getByDisplayValue('Modified rule')).toBeInTheDocument();
  });

  it('triggers Export JSON download on click', () => {
    const profile = createMockProfile();
    render(<EditorView {...defaultProps({ profiles: [profile], activeProfileId: profile.id })} />);
    const mockUrl = 'blob:http://localhost/mock';
    const createObjectURLSpy = vi.fn(() => mockUrl);
    globalThis.URL.createObjectURL = createObjectURLSpy;
    const clickSpy = vi.fn();
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'a') return { href: '', download: '', click: clickSpy } as any;
      return document.createElement(tag);
    });
    fireEvent.click(screen.getByText('Export JSON'));
    expect(createObjectURLSpy).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    vi.restoreAllMocks();
  });

  // ── MCP Servers Tab Tests ───────────────────────────────────────────────

  it('renders existing MCP servers in the tools tab', () => {
    const profile = createMockProfile({
      tools: [{ id: 's1', name: 'github', description: '', command: 'npx', args: ['-y', 'pkg'], env: {} }],
    });
    render(<EditorView {...defaultProps({ profiles: [profile], activeProfileId: profile.id })} />);
    fireEvent.click(screen.getByText('MCP Servers'));
    expect(screen.getByDisplayValue('github')).toBeInTheDocument();
    expect(screen.getByDisplayValue('npx')).toBeInTheDocument();
  });

  it('adds a new MCP server entry', () => {
    const profile = createMockProfile({ tools: [] });
    render(<EditorView {...defaultProps({ profiles: [profile], activeProfileId: profile.id })} />);
    fireEvent.click(screen.getByText('MCP Servers'));
    fireEvent.click(screen.getByText('Add MCP Server'));
    expect(screen.getByText('Server #1')).toBeInTheDocument();
  });

  it('removes an MCP server entry after confirmation', () => {
    const profile = createMockProfile({
      tools: [{ id: 's1', name: 'github', description: '', command: 'npx', args: [], env: {} }],
    });
    render(<EditorView {...defaultProps({ profiles: [profile], activeProfileId: profile.id })} />);
    fireEvent.click(screen.getByText('MCP Servers'));
    expect(screen.getByDisplayValue('github')).toBeInTheDocument();
    fireEvent.click(screen.getByTitle('Remove server'));
    // Must confirm before removal happens
    expect(screen.getByDisplayValue('github')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('server-remove-confirm-btn'));
    expect(screen.queryByDisplayValue('github')).not.toBeInTheDocument();
  });

  // ── Deploy Tab Tests ────────────────────────────────────────────────────

  it('shows validation status on Deploy tab with no servers', () => {
    const profile = createMockProfile({ tools: [] });
    render(<EditorView {...defaultProps({ profiles: [profile], activeProfileId: profile.id })} />);
    fireEvent.click(screen.getByText('Deploy'));
    expect(screen.getByText('Invalid MCP Configuration')).toBeInTheDocument();
    expect(screen.getByText(/No MCP servers defined/)).toBeInTheDocument();
  });

  it('shows valid status on Deploy tab with valid server', () => {
    const profile = createMockProfile({
      tools: [{ id: 's1', name: 'github', description: '', command: 'npx', args: ['-y', 'pkg'], env: {} }],
    });
    render(<EditorView {...defaultProps({ profiles: [profile], activeProfileId: profile.id })} />);
    fireEvent.click(screen.getByText('Deploy'));
    expect(screen.getByText('Valid MCP Configuration')).toBeInTheDocument();
  });

  it('shows the correct config file path for Cursor', () => {
    const profile = createMockProfile({ tool: 'Cursor', tools: [] });
    render(<EditorView {...defaultProps({ profiles: [profile], activeProfileId: profile.id })} />);
    fireEvent.click(screen.getByText('Deploy'));
    expect(screen.getByTestId('global-path').textContent).toBe('~/.cursor/mcp.json');
  });

  it('shows generated JSON config output', () => {
    const profile = createMockProfile({
      tools: [{ id: 's1', name: 'test-server', description: '', command: 'node', args: ['index.js'], env: {} }],
    });
    render(<EditorView {...defaultProps({ profiles: [profile], activeProfileId: profile.id })} />);
    fireEvent.click(screen.getByText('Deploy'));
    const output = screen.getByTestId('config-output').textContent!;
    expect(output).toContain('mcpServers');
    expect(output).toContain('test-server');
  });

  it('renders Copy to Clipboard button on Deploy tab', () => {
    const profile = createMockProfile({ tools: [] });
    render(<EditorView {...defaultProps({ profiles: [profile], activeProfileId: profile.id })} />);
    fireEvent.click(screen.getByText('Deploy'));
    expect(screen.getByText('Copy to Clipboard')).toBeInTheDocument();
  });

  // ── Feature 1: Save Toast ───────────────────────────────────────────────

  it('shows "Saved!" feedback after clicking Save Changes', () => {
    vi.useFakeTimers();
    const profile = createMockProfile();
    render(<EditorView {...defaultProps({ profiles: [profile], activeProfileId: profile.id })} />);
    fireEvent.click(screen.getByTestId('save-btn'));
    expect(screen.getByText('Saved!')).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('save feedback reverts to "Save Changes" after 2 seconds', () => {
    vi.useFakeTimers();
    const profile = createMockProfile();
    render(<EditorView {...defaultProps({ profiles: [profile], activeProfileId: profile.id })} />);
    fireEvent.click(screen.getByTestId('save-btn'));
    expect(screen.getByText('Saved!')).toBeInTheDocument();

    act(() => void vi.advanceTimersByTime(2001));
    expect(screen.getByText('Save Changes')).toBeInTheDocument();
    vi.useRealTimers();
  });

  // ── Feature 2: Deploy Button ────────────────────────────────────────────

  it('shows Deploy to Global Config button on Deploy tab when config is valid', () => {
    const profile = createMockProfile({
      tools: [{ id: 's1', name: 'github', description: '', command: 'npx', args: ['-y', 'pkg'], env: {} }],
    });
    render(<EditorView {...defaultProps({ profiles: [profile], activeProfileId: profile.id })} />);
    fireEvent.click(screen.getByText('Deploy'));
    expect(screen.getByTestId('deploy-btn')).toBeInTheDocument();
    expect(screen.getByText('Deploy to Global Config')).toBeInTheDocument();
  });

  it('deploy button is disabled when config is invalid', () => {
    const profile = createMockProfile({ tools: [] });
    render(<EditorView {...defaultProps({ profiles: [profile], activeProfileId: profile.id })} />);
    fireEvent.click(screen.getByText('Deploy'));
    expect(screen.getByTestId('deploy-btn')).toBeDisabled();
  });

  it('shows confirmation dialog when Deploy button is clicked', () => {
    const profile = createMockProfile({
      tools: [{ id: 's1', name: 'github', description: '', command: 'npx', args: ['-y', 'pkg'], env: {} }],
    });
    render(<EditorView {...defaultProps({ profiles: [profile], activeProfileId: profile.id })} />);
    fireEvent.click(screen.getByText('Deploy'));
    fireEvent.click(screen.getByTestId('deploy-btn'));
    expect(screen.getByTestId('deploy-confirm-dialog')).toBeInTheDocument();
    expect(screen.getByTestId('confirm-path')).toHaveTextContent('~/.cursor/mcp.json');
  });

  it('cancels deploy and returns to idle when Cancel is clicked', () => {
    const profile = createMockProfile({
      tools: [{ id: 's1', name: 'github', description: '', command: 'npx', args: ['-y', 'pkg'], env: {} }],
    });
    render(<EditorView {...defaultProps({ profiles: [profile], activeProfileId: profile.id })} />);
    fireEvent.click(screen.getByText('Deploy'));
    fireEvent.click(screen.getByTestId('deploy-btn'));
    expect(screen.getByTestId('deploy-confirm-dialog')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('cancel-deploy-btn'));
    expect(screen.queryByTestId('deploy-confirm-dialog')).not.toBeInTheDocument();
    expect(screen.getByTestId('deploy-btn')).toBeInTheDocument();
  });

  it('shows unavailable message when API is not running', async () => {
    vi.mocked(isApiAvailable).mockResolvedValue(false);
    const profile = createMockProfile({
      tools: [{ id: 's1', name: 'github', description: '', command: 'npx', args: ['-y', 'pkg'], env: {} }],
    });
    render(<EditorView {...defaultProps({ profiles: [profile], activeProfileId: profile.id })} />);
    fireEvent.click(screen.getByText('Deploy'));
    fireEvent.click(screen.getByTestId('deploy-btn'));      // show confirm
    fireEvent.click(screen.getByTestId('confirm-deploy-btn')); // confirm

    await waitFor(() =>
      expect(screen.getByTestId('deploy-unavailable')).toBeInTheDocument()
    );
    expect(screen.getByText(/API not available/)).toBeInTheDocument();
  });

  it('shows success state when file write succeeds', async () => {
    vi.mocked(isApiAvailable).mockResolvedValue(true);
    vi.mocked(writeConfigToFile).mockResolvedValue({ ok: true });
    const profile = createMockProfile({
      tools: [{ id: 's1', name: 'github', description: '', command: 'npx', args: ['-y', 'pkg'], env: {} }],
    });
    render(<EditorView {...defaultProps({ profiles: [profile], activeProfileId: profile.id })} />);
    fireEvent.click(screen.getByText('Deploy'));
    fireEvent.click(screen.getByTestId('deploy-btn'));
    fireEvent.click(screen.getByTestId('confirm-deploy-btn'));

    await waitFor(() =>
      expect(screen.getByTestId('deploy-success')).toBeInTheDocument()
    );
    expect(screen.getByText(/Config written to/)).toBeInTheDocument();
  });

  it('shows error state when file write fails', async () => {
    vi.mocked(isApiAvailable).mockResolvedValue(true);
    vi.mocked(writeConfigToFile).mockResolvedValue({ ok: false, error: 'Permission denied' });
    const profile = createMockProfile({
      tools: [{ id: 's1', name: 'github', description: '', command: 'npx', args: ['-y', 'pkg'], env: {} }],
    });
    render(<EditorView {...defaultProps({ profiles: [profile], activeProfileId: profile.id })} />);
    fireEvent.click(screen.getByText('Deploy'));
    fireEvent.click(screen.getByTestId('deploy-btn'));
    fireEvent.click(screen.getByTestId('confirm-deploy-btn'));

    await waitFor(() =>
      expect(screen.getByTestId('deploy-error')).toBeInTheDocument()
    );
    expect(screen.getByText(/Permission denied/)).toBeInTheDocument();
  });

  // ── Feature 3: Tools Discovery ──────────────────────────────────────────

  it('shows a Discover Tools button for each MCP server', () => {
    const profile = createMockProfile({
      tools: [{ id: 's1', name: 'github', description: '', command: 'npx', args: ['-y', 'pkg'], env: {} }],
    });
    render(<EditorView {...defaultProps({ profiles: [profile], activeProfileId: profile.id })} />);
    fireEvent.click(screen.getByText('MCP Servers'));
    expect(screen.getByTestId('discover-tools-btn')).toBeInTheDocument();
    expect(screen.getByText('Discover Tools')).toBeInTheDocument();
  });

  it('shows tool badges after successful discovery', async () => {
    const mockTools = [
      { name: 'search_docs', description: 'Search docs' },
      { name: 'list_projects', description: 'List projects' },
    ];
    vi.mocked(discoverMcpTools).mockResolvedValue({ ok: true, tools: mockTools });

    const profile = createMockProfile({
      tools: [{ id: 's1', name: 'supabase', description: '', command: 'npx', args: ['-y', 's@latest'], env: {} }],
    });
    render(<EditorView {...defaultProps({ profiles: [profile], activeProfileId: profile.id })} />);
    fireEvent.click(screen.getByText('MCP Servers'));
    fireEvent.click(screen.getByTestId('discover-tools-btn'));

    await waitFor(() => expect(screen.getByTestId('tool-badges')).toBeInTheDocument());
    expect(screen.getByText('search_docs')).toBeInTheDocument();
    expect(screen.getByText('list_projects')).toBeInTheDocument();
  });

  it('shows the tool count badge after discovery', async () => {
    const mockTools = [
      { name: 'tool_a' }, { name: 'tool_b' }, { name: 'tool_c' },
    ];
    vi.mocked(discoverMcpTools).mockResolvedValue({ ok: true, tools: mockTools });

    const profile = createMockProfile({
      tools: [{ id: 's1', name: 'supabase', description: '', command: 'npx', args: [], env: {} }],
    });
    render(<EditorView {...defaultProps({ profiles: [profile], activeProfileId: profile.id })} />);
    fireEvent.click(screen.getByText('MCP Servers'));
    fireEvent.click(screen.getByTestId('discover-tools-btn'));

    await waitFor(() => expect(screen.getByTestId('tool-count-badge')).toBeInTheDocument());
    expect(screen.getByTestId('tool-count-badge').textContent).toBe('3');
  });

  it('shows discovery error message on failure', async () => {
    vi.mocked(discoverMcpTools).mockResolvedValue({ ok: false, tools: [], error: 'Timed out' });

    const profile = createMockProfile({
      tools: [{ id: 's1', name: 'bad-server', description: '', command: 'npx', args: [], env: {} }],
    });
    render(<EditorView {...defaultProps({ profiles: [profile], activeProfileId: profile.id })} />);
    fireEvent.click(screen.getByText('MCP Servers'));
    fireEvent.click(screen.getByTestId('discover-tools-btn'));

    await waitFor(() => expect(screen.getByTestId('discovery-error')).toBeInTheDocument());
    expect(screen.getByText('Timed out')).toBeInTheDocument();
  });

  it('shows Show more/Show less toggle when there are more than 8 tools', async () => {
    const mockTools = Array.from({ length: 12 }, (_, i) => ({ name: `tool_${i}` }));
    vi.mocked(discoverMcpTools).mockResolvedValue({ ok: true, tools: mockTools });

    const profile = createMockProfile({
      tools: [{ id: 's1', name: 'big-server', description: '', command: 'npx', args: [], env: {} }],
    });
    render(<EditorView {...defaultProps({ profiles: [profile], activeProfileId: profile.id })} />);
    fireEvent.click(screen.getByText('MCP Servers'));
    fireEvent.click(screen.getByTestId('discover-tools-btn'));

    await waitFor(() => expect(screen.getByTestId('toggle-expand-btn')).toBeInTheDocument());
    expect(screen.getByText('Show 4 more')).toBeInTheDocument();

    // Expand
    fireEvent.click(screen.getByTestId('toggle-expand-btn'));
    expect(screen.getByText('Show less')).toBeInTheDocument();

    // All 12 tools visible
    mockTools.forEach(t => expect(screen.getByText(t.name)).toBeInTheDocument());
  });

  // ── Feature: MCP Server removal confirmation ────────────────────────────

  it('shows inline removal confirmation when Remove server is clicked', () => {
    const profile = createMockProfile({
      tools: [{ id: 's1', name: 'github', description: '', command: 'npx', args: [], env: {} }],
    });
    render(<EditorView {...defaultProps({ profiles: [profile], activeProfileId: profile.id })} />);
    fireEvent.click(screen.getByText('MCP Servers'));
    fireEvent.click(screen.getByTitle('Remove server'));
    expect(screen.getByTestId('server-remove-confirm')).toBeInTheDocument();
    expect(screen.getByText('Remove this server?')).toBeInTheDocument();
  });

  it('removes the server after confirming removal', () => {
    const profile = createMockProfile({
      tools: [{ id: 's1', name: 'github', description: '', command: 'npx', args: [], env: {} }],
    });
    render(<EditorView {...defaultProps({ profiles: [profile], activeProfileId: profile.id })} />);
    fireEvent.click(screen.getByText('MCP Servers'));
    expect(screen.getByDisplayValue('github')).toBeInTheDocument();

    fireEvent.click(screen.getByTitle('Remove server'));
    fireEvent.click(screen.getByTestId('server-remove-confirm-btn'));

    expect(screen.queryByDisplayValue('github')).not.toBeInTheDocument();
  });

  it('cancels removal and keeps the server', () => {
    const profile = createMockProfile({
      tools: [{ id: 's1', name: 'github', description: '', command: 'npx', args: [], env: {} }],
    });
    render(<EditorView {...defaultProps({ profiles: [profile], activeProfileId: profile.id })} />);
    fireEvent.click(screen.getByText('MCP Servers'));

    fireEvent.click(screen.getByTitle('Remove server'));
    expect(screen.getByTestId('server-remove-confirm')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('server-remove-cancel'));
    expect(screen.queryByTestId('server-remove-confirm')).not.toBeInTheDocument();
    expect(screen.getByDisplayValue('github')).toBeInTheDocument();
  });
});

