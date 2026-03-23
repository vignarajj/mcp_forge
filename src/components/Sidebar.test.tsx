import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Sidebar } from './Sidebar';

describe('Sidebar Component', () => {
  it('renders all navigation items', () => {
    render(<Sidebar currentView="profiles" setCurrentView={vi.fn()} />);
    expect(screen.getByText('Profiles')).toBeInTheDocument();
    expect(screen.getByText('Tools')).toBeInTheDocument();
    expect(screen.getByText('Editor')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('calls setCurrentView when a navigation item is clicked', () => {
    const setCurrentView = vi.fn();
    render(<Sidebar currentView="profiles" setCurrentView={setCurrentView} />);
    fireEvent.click(screen.getByText('Tools'));
    expect(setCurrentView).toHaveBeenCalledWith('tools');
  });

  it('highlights the active view', () => {
    render(<Sidebar currentView="editor" setCurrentView={vi.fn()} />);
    const editorButton = screen.getByText('Editor').closest('button');
    expect(editorButton).toHaveClass('bg-neutral-800');
    expect(editorButton).toHaveClass('text-white');

    const profilesButton = screen.getByText('Profiles').closest('button');
    expect(profilesButton).not.toHaveClass('bg-neutral-800');
    expect(profilesButton).toHaveClass('text-neutral-500');
  });

  it('does NOT render a version footer', () => {
    render(<Sidebar currentView="profiles" setCurrentView={vi.fn()} />);
    expect(screen.queryByText('v1.0.0')).not.toBeInTheDocument();
  });

  it('does NOT render a Local Mode footer', () => {
    render(<Sidebar currentView="profiles" setCurrentView={vi.fn()} />);
    expect(screen.queryByText('Local Mode')).not.toBeInTheDocument();
  });

  it('renders the MCP Forge brand name', () => {
    render(<Sidebar currentView="profiles" setCurrentView={vi.fn()} />);
    expect(screen.getByText('MCP Forge')).toBeInTheDocument();
  });
});
