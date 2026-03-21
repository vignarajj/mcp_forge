import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Sidebar } from './Sidebar';

describe('Sidebar Component', () => {
  it('renders all navigation items', () => {
    const mockSetCurrentView = vi.fn();
    render(<Sidebar currentView="profiles" setCurrentView={mockSetCurrentView} />);

    expect(screen.getByText('Profiles')).toBeInTheDocument();
    expect(screen.getByText('Tools')).toBeInTheDocument();
    expect(screen.getByText('Editor')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('calls setCurrentView when a navigation item is clicked', () => {
    const mockSetCurrentView = vi.fn();
    render(<Sidebar currentView="profiles" setCurrentView={mockSetCurrentView} />);

    const toolsButton = screen.getByText('Tools');
    fireEvent.click(toolsButton);

    expect(mockSetCurrentView).toHaveBeenCalledWith('tools');
  });

  it('highlights the active view', () => {
    const mockSetCurrentView = vi.fn();
    render(<Sidebar currentView="editor" setCurrentView={mockSetCurrentView} />);

    const editorButton = screen.getByText('Editor').closest('button');
    expect(editorButton).toHaveClass('bg-neutral-900');
    expect(editorButton).toHaveClass('text-white');

    const profilesButton = screen.getByText('Profiles').closest('button');
    expect(profilesButton).not.toHaveClass('bg-neutral-900');
    expect(profilesButton).toHaveClass('text-neutral-400');
  });
});
