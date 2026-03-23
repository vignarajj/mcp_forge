import { renderHook, act, waitFor } from '@testing-library/react';
import { useProfiles } from './useProfiles';
import { beforeEach, describe, it, expect } from 'vitest';
import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';

// Reset IndexedDB between tests so state doesn't leak
beforeEach(() => {
  // Replace the global indexedDB instance with a fresh one
  (globalThis as Record<string, unknown>).indexedDB = new IDBFactory();
});

describe('useProfiles', () => {
  it('initialises with empty profiles', async () => {
    const { result } = renderHook(() => useProfiles());
    await waitFor(() => expect(result.current.loaded).toBe(true));
    expect(result.current.profiles).toEqual([]);
    expect(result.current.activeProfileId).toBeNull();
  });

  it('adds a new profile', async () => {
    const { result } = renderHook(() => useProfiles());
    await waitFor(() => expect(result.current.loaded).toBe(true));

    act(() => { result.current.addProfile('Test Profile', 'Cursor'); });

    expect(result.current.profiles).toHaveLength(1);
    expect(result.current.profiles[0].name).toBe('Test Profile');
    expect(result.current.profiles[0].tool).toBe('Cursor');
    expect(result.current.activeProfileId).toBe(result.current.profiles[0].id);
  });

  it('updates an existing profile', async () => {
    const { result } = renderHook(() => useProfiles());
    await waitFor(() => expect(result.current.loaded).toBe(true));

    act(() => { result.current.addProfile('Test Profile', 'Cursor'); });
    const profileId = result.current.profiles[0].id;

    act(() => { result.current.updateProfile(profileId, { name: 'Updated Profile', rules: ['Rule 1'] }); });

    expect(result.current.profiles[0].name).toBe('Updated Profile');
    expect(result.current.profiles[0].rules).toEqual(['Rule 1']);
  });

  it('deletes a profile', async () => {
    const { result } = renderHook(() => useProfiles());
    await waitFor(() => expect(result.current.loaded).toBe(true));

    act(() => {
      result.current.addProfile('Test Profile 1', 'Cursor');
      result.current.addProfile('Test Profile 2', 'Claude Code');
    });
    expect(result.current.profiles).toHaveLength(2);
    const idToDelete = result.current.profiles[0].id;

    act(() => { result.current.deleteProfile(idToDelete); });

    expect(result.current.profiles).toHaveLength(1);
    expect(result.current.profiles[0].name).toBe('Test Profile 2');
  });

  it('duplicates a profile', async () => {
    const { result } = renderHook(() => useProfiles());
    await waitFor(() => expect(result.current.loaded).toBe(true));

    act(() => { result.current.addProfile('Test Profile', 'Cursor'); });
    const profileId = result.current.profiles[0].id;
    act(() => { result.current.updateProfile(profileId, { rules: ['Rule 1'] }); });
    act(() => { result.current.duplicateProfile(profileId); });

    expect(result.current.profiles).toHaveLength(2);
    expect(result.current.profiles[1].name).toBe('Test Profile (Copy)');
    expect(result.current.profiles[1].rules).toEqual(['Rule 1']);
    expect(result.current.activeProfileId).toBe(result.current.profiles[1].id);
  });

  it('clears activeProfileId when the active profile is deleted', async () => {
    const { result } = renderHook(() => useProfiles());
    await waitFor(() => expect(result.current.loaded).toBe(true));

    act(() => { result.current.addProfile('Profile A', 'Cursor'); });
    const activeId = result.current.activeProfileId;
    expect(activeId).not.toBeNull();

    act(() => { result.current.deleteProfile(activeId!); });

    expect(result.current.activeProfileId).toBeNull();
    expect(result.current.profiles).toHaveLength(0);
  });

  it('does not clear activeProfileId when deleting a non-active profile', async () => {
    const { result } = renderHook(() => useProfiles());
    await waitFor(() => expect(result.current.loaded).toBe(true));

    act(() => { result.current.addProfile('Profile A', 'Cursor'); });
    act(() => { result.current.addProfile('Profile B', 'Claude Code'); });

    const activeId = result.current.activeProfileId;
    const otherId = result.current.profiles.find(p => p.id !== activeId)!.id;

    act(() => { result.current.deleteProfile(otherId); });

    expect(result.current.activeProfileId).toBe(activeId);
    expect(result.current.profiles).toHaveLength(1);
  });

  it('does not duplicate a nonexistent profile', async () => {
    const { result } = renderHook(() => useProfiles());
    await waitFor(() => expect(result.current.loaded).toBe(true));

    act(() => { result.current.duplicateProfile('nonexistent-id'); });

    expect(result.current.profiles).toHaveLength(0);
  });

  it('updates the updatedAt timestamp when updating a profile', async () => {
    const { result } = renderHook(() => useProfiles());
    await waitFor(() => expect(result.current.loaded).toBe(true));

    act(() => { result.current.addProfile('Profile', 'Cursor'); });
    const original = result.current.profiles[0].updatedAt;

    act(() => { result.current.updateProfile(result.current.profiles[0].id, { name: 'Renamed' }); });

    expect(result.current.profiles[0].updatedAt).toBeGreaterThanOrEqual(original);
    expect(result.current.profiles[0].name).toBe('Renamed');
  });

  it('setActiveProfileId updates state', async () => {
    const { result } = renderHook(() => useProfiles());
    await waitFor(() => expect(result.current.loaded).toBe(true));

    act(() => {
      result.current.addProfile('Profile A', 'Cursor');
      result.current.addProfile('Profile B', 'Cursor');
    });
    const firstId = result.current.profiles[0].id;
    act(() => { result.current.setActiveProfileId(firstId); });
    expect(result.current.activeProfileId).toBe(firstId);

    act(() => { result.current.setActiveProfileId(null); });
    expect(result.current.activeProfileId).toBeNull();
  });
});
