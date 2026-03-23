import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App Component', () => {
  it('renders the sidebar and default Profiles view', () => {
    render(<App />);
    expect(screen.getByText('MCP Forge')).toBeInTheDocument();
    expect(screen.getAllByText('Profiles').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Manage your MCP configurations')).toBeInTheDocument();
  });

  it('navigates to the Tools view when clicking Tools', () => {
    render(<App />);
    fireEvent.click(screen.getByText('Tools'));
    expect(screen.getByText('Supported Tools')).toBeInTheDocument();
  });

  it('navigates to the Editor view when clicking Editor', () => {
    render(<App />);
    fireEvent.click(screen.getByText('Editor'));
    expect(screen.getByText('No Profile Selected')).toBeInTheDocument();
  });

  it('navigates to the Settings view when clicking Settings', () => {
    render(<App />);
    fireEvent.click(screen.getByText('Settings'));
    expect(screen.getByText('Application preferences and system info')).toBeInTheDocument();
  });

  it('renders the macOS title bar simulation dots', () => {
    const { container } = render(<App />);
    // Target only the title bar dots: w-3 h-3 rounded-full (the traffic lights)
    const dots = container.querySelectorAll('.w-3.h-3.rounded-full');
    expect(dots.length).toBe(3);
  });

  it('navigates from Profiles to Editor when edit is clicked on a profile', () => {
    render(<App />);

    // Create a profile first
    fireEvent.click(screen.getByText('New Profile'));
    fireEvent.change(screen.getByPlaceholderText('e.g., React Frontend Project'), {
      target: { value: 'My Test Profile' },
    });
    fireEvent.click(screen.getByText('Create'));

    // Click the edit button on the profile card
    const editButton = screen.getByTitle('Edit');
    fireEvent.click(editButton);

    // Should now be in Editor view showing the profile
    expect(screen.getByText('My Test Profile')).toBeInTheDocument();
    expect(screen.getByText('Editing MCP configuration')).toBeInTheDocument();
  });
});
