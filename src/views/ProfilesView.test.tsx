import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProfilesView } from './ProfilesView';
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
    onEdit: vi.fn(),
    loaded: true,
    ...overrides,
  };
}

describe('ProfilesView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the empty state when there are no profiles', () => {
    render(<ProfilesView {...defaultProps()} />);
    expect(screen.getByText('No profiles found')).toBeInTheDocument();
    expect(screen.getByText('Get started by creating a new MCP profile.')).toBeInTheDocument();
  });

  it('renders a list of profiles', () => {
    const profiles = [
      createMockProfile({ name: 'Profile A', tool: 'Cursor' }),
      createMockProfile({ name: 'Profile B', tool: 'Claude Code' }),
    ];
    render(<ProfilesView {...defaultProps({ profiles })} />);
    expect(screen.getByText('Profile A')).toBeInTheDocument();
    expect(screen.getByText('Profile B')).toBeInTheDocument();
    expect(screen.getByText('Cursor')).toBeInTheDocument();
    expect(screen.getByText('Claude Code')).toBeInTheDocument();
  });

  it('filters profiles by search query', () => {
    const profiles = [
      createMockProfile({ name: 'React Frontend' }),
      createMockProfile({ name: 'Go Backend' }),
    ];
    render(<ProfilesView {...defaultProps({ profiles })} />);

    fireEvent.change(screen.getByPlaceholderText('Search profiles...'), { target: { value: 'react' } });
    expect(screen.getByText('React Frontend')).toBeInTheDocument();
    expect(screen.queryByText('Go Backend')).not.toBeInTheDocument();
  });

  it('opens the create form when clicking New Profile', () => {
    render(<ProfilesView {...defaultProps()} />);
    fireEvent.click(screen.getByText('New Profile'));
    expect(screen.getByText('Create New Profile')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g., React Frontend Project')).toBeInTheDocument();
  });

  it('calls addProfile on form submit', () => {
    const addProfile = vi.fn();
    render(<ProfilesView {...defaultProps({ addProfile })} />);
    fireEvent.click(screen.getByText('New Profile'));
    fireEvent.change(screen.getByPlaceholderText('e.g., React Frontend Project'), {
      target: { value: 'My New Profile' },
    });
    fireEvent.click(screen.getByText('Create'));
    expect(addProfile).toHaveBeenCalledWith('My New Profile', 'Cursor');
  });

  it('closes the create form on cancel', () => {
    render(<ProfilesView {...defaultProps()} />);
    fireEvent.click(screen.getByText('New Profile'));
    expect(screen.getByText('Create New Profile')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByText('Create New Profile')).not.toBeInTheDocument();
  });

  // ── Delete confirmation ─────────────────────────────────────────────────

  it('shows delete confirmation dialog when clicking the delete button', () => {
    const profiles = [createMockProfile({ name: 'To Delete' })];
    render(<ProfilesView {...defaultProps({ profiles })} />);

    fireEvent.click(screen.getByTitle('Delete'));
    expect(screen.getByTestId('delete-confirm-dialog')).toBeInTheDocument();
    expect(screen.getByText(/"To Delete"/)).toBeInTheDocument();
  });

  it('calls deleteProfile only after confirming', () => {
    const deleteProfile = vi.fn();
    const profiles = [createMockProfile({ name: 'To Delete' })];
    render(<ProfilesView {...defaultProps({ profiles, deleteProfile })} />);

    fireEvent.click(screen.getByTitle('Delete'));
    expect(deleteProfile).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId('delete-confirm-btn'));
    expect(deleteProfile).toHaveBeenCalledWith(profiles[0].id);
  });

  it('dismisses the confirmation dialog on Cancel without deleting', () => {
    const deleteProfile = vi.fn();
    const profiles = [createMockProfile({ name: 'To Delete' })];
    render(<ProfilesView {...defaultProps({ profiles, deleteProfile })} />);

    fireEvent.click(screen.getByTitle('Delete'));
    expect(screen.getByTestId('delete-confirm-dialog')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('delete-cancel-btn'));

    expect(screen.queryByTestId('delete-confirm-dialog')).not.toBeInTheDocument();
    expect(deleteProfile).not.toHaveBeenCalled();
  });

  it('does NOT immediately call deleteProfile when trash icon is clicked', () => {
    const deleteProfile = vi.fn();
    const profiles = [createMockProfile({ name: 'Safe Profile' })];
    render(<ProfilesView {...defaultProps({ profiles, deleteProfile })} />);

    fireEvent.click(screen.getByTitle('Delete'));
    expect(deleteProfile).not.toHaveBeenCalled();
  });

  // ── Other actions ───────────────────────────────────────────────────────

  it('calls duplicateProfile when clicking the duplicate button', () => {
    const duplicateProfile = vi.fn();
    const profiles = [createMockProfile({ name: 'To Duplicate' })];
    render(<ProfilesView {...defaultProps({ profiles, duplicateProfile })} />);
    fireEvent.click(screen.getByTitle('Duplicate'));
    expect(duplicateProfile).toHaveBeenCalledWith(profiles[0].id);
  });

  it('calls onEdit when clicking the edit button', () => {
    const onEdit = vi.fn();
    const profiles = [createMockProfile({ name: 'To Edit' })];
    render(<ProfilesView {...defaultProps({ profiles, onEdit })} />);
    fireEvent.click(screen.getByTitle('Edit'));
    expect(onEdit).toHaveBeenCalledWith(profiles[0].id);
  });

  it('calls setActiveProfileId when clicking Set Active', () => {
    const setActiveProfileId = vi.fn();
    const profiles = [createMockProfile({ name: 'Inactive Profile' })];
    render(<ProfilesView {...defaultProps({ profiles, setActiveProfileId, activeProfileId: null })} />);
    fireEvent.click(screen.getByText('Set Active'));
    expect(setActiveProfileId).toHaveBeenCalledWith(profiles[0].id);
  });

  it('shows Active indicator for the active profile', () => {
    const profiles = [createMockProfile({ name: 'Active Profile' })];
    render(<ProfilesView {...defaultProps({ profiles, activeProfileId: profiles[0].id })} />);
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.queryByText('Set Active')).not.toBeInTheDocument();
  });

  it('does not submit the form if the name is empty', () => {
    const addProfile = vi.fn();
    render(<ProfilesView {...defaultProps({ addProfile })} />);
    fireEvent.click(screen.getByText('New Profile'));
    fireEvent.click(screen.getByText('Create'));
    expect(addProfile).not.toHaveBeenCalled();
  });

  it('allows selecting a different tool from the dropdown', () => {
    const addProfile = vi.fn();
    render(<ProfilesView {...defaultProps({ addProfile })} />);
    fireEvent.click(screen.getByText('New Profile'));

    fireEvent.change(screen.getByDisplayValue('Cursor'), { target: { value: 'Claude Code' } });
    fireEvent.change(screen.getByPlaceholderText('e.g., React Frontend Project'), {
      target: { value: 'Claude Profile' },
    });
    fireEvent.click(screen.getByText('Create'));
    expect(addProfile).toHaveBeenCalledWith('Claude Profile', 'Claude Code');
  });

  it('shows the Updated date on each profile card', () => {
    const profiles = [
      createMockProfile({ name: 'Dated Profile', updatedAt: new Date('2025-06-15').getTime() }),
    ];
    render(<ProfilesView {...defaultProps({ profiles })} />);
    expect(screen.getByText(/Updated/)).toBeInTheDocument();
  });
});
