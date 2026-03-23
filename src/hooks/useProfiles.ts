import { useState, useEffect, useCallback, useRef } from 'react';
import { McpProfile, ToolName } from '../types';

// ─── IndexedDB storage layer ──────────────────────────────────────────────────
const DB_NAME = 'mcp-forge';
const DB_VERSION = 1;
const STORE_PROFILES = 'profiles';
const STORE_META = 'meta';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_PROFILES)) {
        db.createObjectStore(STORE_PROFILES, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function dbGetAllProfiles(): Promise<McpProfile[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PROFILES, 'readonly');
    const req = tx.objectStore(STORE_PROFILES).getAll();
    req.onsuccess = () => resolve((req.result as McpProfile[]).sort((a, b) => a.createdAt - b.createdAt));
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}

async function dbPutProfile(profile: McpProfile): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PROFILES, 'readwrite');
    tx.objectStore(STORE_PROFILES).put(profile);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => reject(tx.error);
  });
}

async function dbDeleteProfile(id: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PROFILES, 'readwrite');
    tx.objectStore(STORE_PROFILES).delete(id);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => reject(tx.error);
  });
}

async function dbGetMeta(key: string): Promise<string | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_META, 'readonly');
    const req = tx.objectStore(STORE_META).get(key);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}

async function dbSetMeta(key: string, value: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_META, 'readwrite');
    tx.objectStore(STORE_META).put(value, key);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => reject(tx.error);
  });
}

async function dbDeleteMeta(key: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_META, 'readwrite');
    tx.objectStore(STORE_META).delete(key);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => reject(tx.error);
  });
}

export async function dbClearAll(): Promise<void> {
  // Clear localStorage as a fallback for old legacy data
  localStorage.clear();
  
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_PROFILES, STORE_META], 'readwrite');
    tx.objectStore(STORE_PROFILES).clear();
    tx.objectStore(STORE_META).clear();
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
    tx.onabort = () => { db.close(); reject(tx.error); };
  });
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useProfiles() {
  const [profiles, setProfiles] = useState<McpProfile[]>([]);
  const [activeProfileId, setActiveProfileIdState] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const pendingActiveId = useRef<string | null>(null);

  // Load from IndexedDB on mount
  useEffect(() => {
    let mounted = true;
    Promise.all([dbGetAllProfiles(), dbGetMeta('activeProfileId')]).then(([profs, activeId]) => {
      if (!mounted) return;
      setProfiles(profs);
      setActiveProfileIdState(activeId);
      setLoaded(true);
    }).catch((e) => {
      console.error('Failed to load profiles from IndexedDB', e);
      if (mounted) setLoaded(true);
    });
    return () => { mounted = false; };
  }, []);

  const setActiveProfileId = useCallback((id: string | null) => {
    setActiveProfileIdState(id);
    if (id) {
      dbSetMeta('activeProfileId', id).catch(console.error);
    } else {
      dbDeleteMeta('activeProfileId').catch(console.error);
    }
  }, []);

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
    setProfiles(prev => [...prev, newProfile]);
    setActiveProfileId(newProfile.id);
    dbPutProfile(newProfile).catch(console.error);
    return newProfile;
  }, [setActiveProfileId]);

  const updateProfile = useCallback((id: string, updates: Partial<McpProfile>) => {
    setProfiles(prev =>
      prev.map(p => {
        if (p.id !== id) return p;
        const updated = { ...p, ...updates, updatedAt: Date.now() };
        dbPutProfile(updated).catch(console.error);
        return updated;
      })
    );
  }, []);

  const deleteProfile = useCallback((id: string) => {
    setProfiles(prev => prev.filter(p => p.id !== id));
    dbDeleteProfile(id).catch(console.error);
    setActiveProfileIdState(prev => {
      if (prev === id) {
        dbDeleteMeta('activeProfileId').catch(console.error);
        return null;
      }
      return prev;
    });
  }, []);

  const duplicateProfile = useCallback((id: string) => {
    setProfiles(prev => {
      const profileToDuplicate = prev.find(p => p.id === id);
      if (!profileToDuplicate) return prev;
      const newProfile: McpProfile = {
        ...profileToDuplicate,
        id: crypto.randomUUID(),
        name: `${profileToDuplicate.name} (Copy)`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      dbPutProfile(newProfile).catch(console.error);
      setActiveProfileId(newProfile.id);
      return [...prev, newProfile];
    });
  }, [setActiveProfileId]);

  return {
    profiles,
    activeProfileId,
    setActiveProfileId,
    addProfile,
    updateProfile,
    deleteProfile,
    duplicateProfile,
    loaded,
  };
}
