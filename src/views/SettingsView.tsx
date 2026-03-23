import { useState, useCallback, useEffect } from 'react';
import { HardDrive, Shield, Info, AlertTriangle, CheckCircle2, Zap, Layers, Code, Rocket } from 'lucide-react';
import { dbClearAll } from '../hooks/useProfiles';

async function getIndexedDbSize(): Promise<string> {
  try {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const used = estimate.usage ?? 0;
      if (used < 1024) return `${used} B`;
      if (used < 1024 * 1024) return `${(used / 1024).toFixed(1)} KB`;
      return `${(used / (1024 * 1024)).toFixed(1)} MB`;
    }
  } catch { /* ignore */ }
  return '—';
}

const FEATURES = [
  { icon: Layers, label: 'Unlimited Profiles', desc: 'Create profiles for any number of projects and tools.' },
  { icon: Code, label: 'Visual MCP Server Editor', desc: 'Add, edit, and remove MCP servers with name, command, args, and env vars.' },
  { icon: Zap, label: 'Live Tools Discovery', desc: 'Introspect any MCP server and see its available tools instantly.' },
  { icon: Rocket, label: 'Deploy to File', desc: 'Write config directly to the target path with one click.' },
  { icon: CheckCircle2, label: 'Config Validation', desc: 'Real-time validation catches errors, duplicates, and missing flags.' },
  { icon: Shield, label: '100% Local', desc: 'No cloud, no accounts, no telemetry. Everything stays on your device.' },
];

export function SettingsView({ profilesCount }: { profilesCount: number }) {
  const [storageSize, setStorageSize] = useState<string>('—');
  const [clearState, setClearState] = useState<'idle' | 'confirming'>('idle');

  useEffect(() => {
    getIndexedDbSize().then(setStorageSize);
  }, []);

  const handleClearRequest = () => setClearState('confirming');
  const handleClearCancel = () => setClearState('idle');

  const handleClearConfirm = useCallback(async () => {
    await dbClearAll();
    setClearState('idle');
    window.location.reload();
  }, []);

  return (
    <div className="flex-1 flex flex-col h-full bg-black">
      <header className="flex items-center justify-between px-8 py-6 border-b border-neutral-900">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-white">Settings</h2>
          <p className="text-sm text-neutral-400 mt-1">Application preferences and system info</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-3xl space-y-8">

          {/* Storage */}
          <section className="space-y-4">
            <h3 className="text-lg font-medium text-white flex items-center space-x-2">
              <HardDrive size={18} className="text-neutral-500" />
              <span>Storage</span>
            </h3>
            <div className="p-6 rounded-xl border border-neutral-800 bg-neutral-900/20 space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-white">Storage Backend</p>
                  <p className="text-xs text-neutral-500 mt-1">Browser IndexedDB</p>
                </div>
              </div>
              <div className="pt-4 border-t border-neutral-800 flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-white">Data Usage</p>
                  <p className="text-xs text-neutral-500 mt-1" data-testid="storage-size">
                    {profilesCount} saved profile{profilesCount === 1 ? '' : 's'} (Host cache: {storageSize})
                  </p>
                </div>
                {clearState === 'idle' && profilesCount > 0 && (
                  <button
                    onClick={handleClearRequest}
                    data-testid="clear-all-btn"
                    className="px-3 py-1.5 border border-red-900/50 text-red-400 rounded-md text-xs font-medium hover:bg-red-900/20 transition-colors"
                  >
                    Clear All Data
                  </button>
                )}
              </div>

              {/* Confirmation dialog */}
              {clearState === 'confirming' && (
                <div className="mt-2 p-4 rounded-lg bg-red-950/30 border border-red-900/40" data-testid="clear-confirm-dialog">
                  <div className="flex items-start space-x-3 mb-4">
                    <AlertTriangle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-300">Delete all profiles?</p>
                      <p className="text-xs text-red-400/70 mt-1">
                        This will permanently delete all your MCP profiles and configurations. This action cannot be undone.
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={handleClearConfirm}
                      data-testid="clear-confirm-btn"
                      className="px-3 py-1.5 bg-red-600 text-white rounded-md text-xs font-medium hover:bg-red-700 transition-colors"
                    >
                      Yes, Delete Everything
                    </button>
                    <button
                      onClick={handleClearCancel}
                      data-testid="clear-cancel-btn"
                      className="px-3 py-1.5 border border-neutral-700 text-neutral-300 rounded-md text-xs font-medium hover:bg-neutral-800 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Privacy & Security */}
          <section className="space-y-4">
            <h3 className="text-lg font-medium text-white flex items-center space-x-2">
              <Shield size={18} className="text-neutral-500" />
              <span>Privacy & Security</span>
            </h3>
            <div className="p-6 rounded-xl border border-neutral-800 bg-neutral-900/20 space-y-4">
              <div className="flex items-start space-x-3">
                <div className="mt-0.5">
                  <div className="w-4 h-4 rounded-sm bg-white flex items-center justify-center">
                    <div className="w-2 h-2 bg-black rounded-sm"></div>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">100% Local Mode Enforced</p>
                  <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                    MCP Forge operates entirely offline. No telemetry, no cloud sync, no accounts.
                    All your profiles and configurations remain securely on your device.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* About */}
          <section className="space-y-4">
            <h3 className="text-lg font-medium text-white flex items-center space-x-2">
              <Info size={18} className="text-neutral-500" />
              <span>About</span>
            </h3>
            <div className="p-6 rounded-xl border border-neutral-800 bg-neutral-900/20 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">MCP Forge</p>
                  <p className="text-xs text-neutral-500 mt-0.5">v1.0.0 · MIT License</p>
                </div>
                <span className="text-xs text-neutral-600 bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded">Local</span>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                A lightweight, 100% local profile manager for MCP (Model Context Protocol)
                configurations. Built for AI coding tools on macOS.
              </p>
              <div className="pt-4 border-t border-neutral-800">
                <p className="text-xs font-medium text-neutral-400 mb-3 uppercase tracking-wider">Features</p>
                <div className="grid grid-cols-1 gap-3">
                  {FEATURES.map(({ icon: Icon, label, desc }) => (
                    <div key={label} className="flex items-start space-x-3">
                      <Icon size={14} className="text-neutral-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-neutral-300">{label}</p>
                        <p className="text-xs text-neutral-600 mt-0.5">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
