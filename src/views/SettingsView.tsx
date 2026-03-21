import { Settings, Download, HardDrive, Shield } from 'lucide-react';

export function SettingsView() {
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
          
          {/* Section 1 */}
          <section className="space-y-4">
            <h3 className="text-lg font-medium text-white flex items-center space-x-2">
              <HardDrive size={18} className="text-neutral-500" />
              <span>Storage</span>
            </h3>
            <div className="p-6 rounded-xl border border-neutral-800 bg-neutral-900/20 space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-white">Local Storage Path</p>
                  <p className="text-xs text-neutral-500 mt-1">~/Library/Application Support/MCP Forge/</p>
                </div>
                <button className="px-3 py-1.5 bg-neutral-800 text-white rounded-md text-xs font-medium hover:bg-neutral-700 transition-colors">
                  Open Folder
                </button>
              </div>
              <div className="pt-4 border-t border-neutral-800 flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-white">Data Usage</p>
                  <p className="text-xs text-neutral-500 mt-1">12 KB used for profiles</p>
                </div>
                <button className="px-3 py-1.5 border border-red-900/50 text-red-400 rounded-md text-xs font-medium hover:bg-red-900/20 transition-colors">
                  Clear All Data
                </button>
              </div>
            </div>
          </section>

          {/* Section 2 */}
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

          {/* Section 3 */}
          <section className="space-y-4">
            <h3 className="text-lg font-medium text-white flex items-center space-x-2">
              <Download size={18} className="text-neutral-500" />
              <span>Updates</span>
            </h3>
            <div className="p-6 rounded-xl border border-neutral-800 bg-neutral-900/20 space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-white">Current Version</p>
                  <p className="text-xs text-neutral-500 mt-1">v1.0.0 (Apple Silicon)</p>
                </div>
                <button className="px-3 py-1.5 bg-white text-black rounded-md text-xs font-medium hover:bg-neutral-200 transition-colors">
                  Check for Updates
                </button>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
