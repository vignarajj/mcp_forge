import { useState, useEffect, useCallback } from 'react';
import { McpProfile, ToolName } from '../types';

const STORAGE_KEY = 'mcp-forge-profiles';

export function useProfiles() {
  const [profiles, setProfiles] = useState<McpProfile[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Failed to parse stored profiles', e);
      }
    }
    return [];
  });

  const [activeProfileId, setActiveProfileId] = useState<string | null>(() => {
    return localStorage.getItem('mcp-forge-active-profile') || null;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
  }, [profiles]);

  useEffect(() => {
    if (activeProfileId) {
      localStorage.setItem('mcp-forge-active-profile', activeProfileId);
    } else {
      localStorage.removeItem('mcp-forge-active-profile');
    }
  }, [activeProfileId]);

  const addProfile = useCallback((name: string, tool: ToolName) => {
    const newProfile: McpProfile = {
      id: crypto.randomUUID(),
      name,
      tool,
      rules: [],
      tools: [],
      contextFolders: [],
      ignorePatterns: [],
      projectSettings: {},
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setProfiles((prev) => [...prev, newProfile]);
    setActiveProfileId(newProfile.id);
    return newProfile;
  }, []);

  const updateProfile = useCallback((id: string, updates: Partial<McpProfile>) => {
    setProfiles((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates, updatedAt: Date.now() } : p))
    );
  }, []);

  const deleteProfile = useCallback((id: string) => {
    setProfiles((prev) => prev.filter((p) => p.id !== id));
    if (activeProfileId === id) {
      setActiveProfileId(null);
    }
  }, [activeProfileId]);

  const duplicateProfile = useCallback((id: string) => {
    const profileToDuplicate = profiles.find((p) => p.id === id);
    if (profileToDuplicate) {
      const newProfile: McpProfile = {
        ...profileToDuplicate,
        id: crypto.randomUUID(),
        name: `${profileToDuplicate.name} (Copy)`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setProfiles((prev) => [...prev, newProfile]);
      setActiveProfileId(newProfile.id);
      return newProfile;
    }
    return null;
  }, [profiles]);

  return {
    profiles,
    activeProfileId,
    setActiveProfileId,
    addProfile,
    updateProfile,
    deleteProfile,
    duplicateProfile,
  };
}
