import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SettingsView } from './SettingsView';

// Mock dbClearAll so we don't hit real IndexedDB in unit tests
vi.mock('../hooks/useProfiles', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../hooks/useProfiles')>();
  return { ...actual, dbClearAll: vi.fn().mockResolvedValue(undefined) };
});

describe('SettingsView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the settings header', () => {
    render(<SettingsView profilesCount={1} />);
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Application preferences and system info')).toBeInTheDocument();
  });

  it('renders the Storage section with IndexedDB label', () => {
    render(<SettingsView profilesCount={1} />);
    expect(screen.getByText('Storage')).toBeInTheDocument();
    expect(screen.getByText('Storage Backend')).toBeInTheDocument();
    expect(screen.getByText('Browser IndexedDB')).toBeInTheDocument();
    expect(screen.getByText('Data Usage')).toBeInTheDocument();
    expect(screen.getByTestId('storage-size')).toBeInTheDocument();
    expect(screen.getByText('Clear All Data')).toBeInTheDocument();
  });

  it('renders the Privacy & Security section', () => {
    render(<SettingsView profilesCount={1} />);
    expect(screen.getByText('Privacy & Security')).toBeInTheDocument();
    expect(screen.getByText('100% Local Mode Enforced')).toBeInTheDocument();
    expect(screen.getByText(/MCP Forge operates entirely offline/)).toBeInTheDocument();
  });

  it('renders the About section with feature list', () => {
    render(<SettingsView profilesCount={1} />);
    expect(screen.getByText('About')).toBeInTheDocument();
    expect(screen.getByText('MCP Forge')).toBeInTheDocument();
    expect(screen.getByText('v1.0.0 · MIT License')).toBeInTheDocument();
    // Feature list items
    expect(screen.getByText('Unlimited Profiles')).toBeInTheDocument();
    expect(screen.getByText('Visual MCP Server Editor')).toBeInTheDocument();
    expect(screen.getByText('Live Tools Discovery')).toBeInTheDocument();
    expect(screen.getByText('Deploy to File')).toBeInTheDocument();
    expect(screen.getByText('Config Validation')).toBeInTheDocument();
  });

  it('does NOT show sidebar version or Local Mode labels', () => {
    render(<SettingsView profilesCount={1} />);
    // These should only appear in the about section, not as sidebar footer
    expect(screen.queryByText('Local Mode')).not.toBeInTheDocument();
  });

  it('shows confirmation dialog when Clear All Data is clicked', () => {
    render(<SettingsView profilesCount={1} />);
    fireEvent.click(screen.getByTestId('clear-all-btn'));
    expect(screen.getByTestId('clear-confirm-dialog')).toBeInTheDocument();
    expect(screen.getByText(/Delete all profiles/)).toBeInTheDocument();
    expect(screen.getByTestId('clear-confirm-btn')).toBeInTheDocument();
    expect(screen.getByTestId('clear-cancel-btn')).toBeInTheDocument();
  });

  it('hides confirmation when Cancel is clicked', () => {
    render(<SettingsView profilesCount={1} />);
    fireEvent.click(screen.getByTestId('clear-all-btn'));
    expect(screen.getByTestId('clear-confirm-dialog')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('clear-cancel-btn'));
    expect(screen.queryByTestId('clear-confirm-dialog')).not.toBeInTheDocument();
    expect(screen.getByTestId('clear-all-btn')).toBeInTheDocument();
  });

  it('calls dbClearAll and reloads when confirmed', async () => {
    const { dbClearAll } = await import('../hooks/useProfiles');
    const reloadMock = vi.fn();
    Object.defineProperty(window, 'location', { value: { reload: reloadMock }, writable: true });

    render(<SettingsView profilesCount={1} />);
    fireEvent.click(screen.getByTestId('clear-all-btn'));
    fireEvent.click(screen.getByTestId('clear-confirm-btn'));

    await waitFor(() => expect(dbClearAll).toHaveBeenCalled());
    await waitFor(() => expect(reloadMock).toHaveBeenCalled());
  });
});
