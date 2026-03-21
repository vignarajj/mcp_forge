import { renderHook, act } from '@testing-library/react';
import { useProfiles } from './useProfiles';
import { beforeEach, describe, it, expect } from 'vitest';

describe('useProfiles', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should initialize with empty profiles if localStorage is empty', () => {
    const { result } = renderHook(() => useProfiles());
    expect(result.current.profiles).toEqual([]);
    expect(result.current.activeProfileId).toBeNull();
  });

  it('should add a new profile', () => {
    const { result } = renderHook(() => useProfiles());

    act(() => {
      result.current.addProfile('Test Profile', 'Cursor');
    });

    expect(result.current.profiles).toHaveLength(1);
    expect(result.current.profiles[0].name).toBe('Test Profile');
    expect(result.current.profiles[0].tool).toBe('Cursor');
    expect(result.current.activeProfileId).toBe(result.current.profiles[0].id);
  });

  it('should update an existing profile', () => {
    const { result } = renderHook(() => useProfiles());

    act(() => {
      result.current.addProfile('Test Profile', 'Cursor');
    });

    const profileId = result.current.profiles[0].id;

    act(() => {
      result.current.updateProfile(profileId, { name: 'Updated Profile', rules: ['Rule 1'] });
    });

    expect(result.current.profiles[0].name).toBe('Updated Profile');
    expect(result.current.profiles[0].rules).toEqual(['Rule 1']);
  });

  it('should delete a profile', () => {
    const { result } = renderHook(() => useProfiles());

    act(() => {
      result.current.addProfile('Test Profile 1', 'Cursor');
      result.current.addProfile('Test Profile 2', 'Claude Code');
    });

    expect(result.current.profiles).toHaveLength(2);
    const profileIdToDelete = result.current.profiles[0].id;

    act(() => {
      result.current.deleteProfile(profileIdToDelete);
    });

    expect(result.current.profiles).toHaveLength(1);
    expect(result.current.profiles[0].name).toBe('Test Profile 2');
  });

  it('should duplicate a profile', () => {
    const { result } = renderHook(() => useProfiles());

    act(() => {
      result.current.addProfile('Test Profile', 'Cursor');
    });

    const profileId = result.current.profiles[0].id;

    act(() => {
      result.current.updateProfile(profileId, { rules: ['Rule 1'] });
    });

    act(() => {
      result.current.duplicateProfile(profileId);
    });

    expect(result.current.profiles).toHaveLength(2);
    expect(result.current.profiles[1].name).toBe('Test Profile (Copy)');
    expect(result.current.profiles[1].rules).toEqual(['Rule 1']);
    expect(result.current.activeProfileId).toBe(result.current.profiles[1].id);
  });

  it('should load profiles from localStorage on mount', () => {
    const mockProfiles = [
      {
        id: '123',
        name: 'Saved Profile',
        tool: 'Cursor',
        rules: [],
        tools: [],
        contextFolders: [],
        ignorePatterns: [],
        projectSettings: {},
        createdAt: 123456,
        updatedAt: 123456,
      },
    ];
    localStorage.setItem('mcp-forge-profiles', JSON.stringify(mockProfiles));
    localStorage.setItem('mcp-forge-active-profile', '123');

    const { result } = renderHook(() => useProfiles());

    expect(result.current.profiles).toHaveLength(1);
    expect(result.current.profiles[0].name).toBe('Saved Profile');
    expect(result.current.activeProfileId).toBe('123');
  });
});
