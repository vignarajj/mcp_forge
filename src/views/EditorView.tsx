import React, { useState, useEffect } from 'react';
import { useProfiles } from '../hooks/useProfiles';
import { Save, Code, Settings2, FolderOpen, ShieldAlert, Plus, Trash2 } from 'lucide-react';
import clsx from 'clsx';

type EditorViewProps = ReturnType<typeof useProfiles>;

export function EditorView({ profiles, activeProfileId, updateProfile }: EditorViewProps) {
  const activeProfile = profiles.find(p => p.id === activeProfileId);
  const [activeTab, setActiveTab] = useState<'rules' | 'tools' | 'context' | 'ignore' | 'settings'>('rules');

  // Local state for editing to avoid constant re-renders on every keystroke
  const [localRules, setLocalRules] = useState<string[]>([]);
  const [localContext, setLocalContext] = useState<string[]>([]);
  const [localIgnore, setLocalIgnore] = useState<string[]>([]);

  useEffect(() => {
    if (activeProfile) {
      setLocalRules(activeProfile.rules || []);
      setLocalContext(activeProfile.contextFolders || []);
      setLocalIgnore(activeProfile.ignorePatterns || []);
    }
  }, [activeProfile]);

  if (!activeProfile) {
    return (
      <div className="flex-1 flex items-center justify-center bg-black">
        <div className="text-center">
          <Code className="mx-auto h-12 w-12 text-neutral-800 mb-4" />
          <h3 className="text-lg font-medium text-white">No Profile Selected</h3>
          <p className="mt-1 text-sm text-neutral-500">Select a profile from the Profiles view to edit.</p>
        </div>
      </div>
    );
  }

  const handleSave = () => {
    updateProfile(activeProfile.id, {
      rules: localRules.filter(r => r.trim() !== ''),
      contextFolders: localContext.filter(c => c.trim() !== ''),
      ignorePatterns: localIgnore.filter(i => i.trim() !== ''),
    });
  };

  const tabs = [
    { id: 'rules', label: 'Rules', icon: ShieldAlert },
    { id: 'tools', label: 'Tools', icon: Settings2 },
    { id: 'context', label: 'Context Folders', icon: FolderOpen },
    { id: 'ignore', label: 'Ignore Patterns', icon: Trash2 },
  ] as const;

  const renderListEditor = (
    items: string[],
    setItems: React.Dispatch<React.SetStateAction<string[]>>,
    placeholder: string
  ) => (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div key={index} className="flex items-start space-x-2">
          <textarea
            value={item}
            onChange={(e) => {
              const newItems = [...items];
              newItems[index] = e.target.value;
              setItems(newItems);
            }}
            placeholder={placeholder}
            className="flex-1 min-h-[60px] p-3 bg-neutral-900 border border-neutral-800 rounded-lg text-sm text-white focus:outline-none focus:border-neutral-600 resize-y"
          />
          <button
            onClick={() => setItems(items.filter((_, i) => i !== index))}
            className="p-2 text-neutral-500 hover:text-red-400 rounded-lg hover:bg-neutral-900"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ))}
      <button
        onClick={() => setItems([...items, ''])}
        className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-neutral-400 hover:text-white border border-dashed border-neutral-800 rounded-lg hover:border-neutral-600 w-full justify-center transition-colors"
      >
        <Plus size={16} />
        <span>Add Item</span>
      </button>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-black">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-6 border-b border-neutral-900">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-white flex items-center space-x-3">
            <span>{activeProfile.name}</span>
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-neutral-800 text-neutral-300">
              {activeProfile.tool}
            </span>
          </h2>
          <p className="text-sm text-neutral-500 mt-1">Editing MCP configuration</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => {
              const json = JSON.stringify(activeProfile, null, 2);
              const blob = new Blob([json], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${activeProfile.name.toLowerCase().replace(/\s+/g, '-')}.mcp.json`;
              a.click();
            }}
            className="px-4 py-2 border border-neutral-800 text-white rounded-lg text-sm font-medium hover:bg-neutral-900 transition-colors"
          >
            Export JSON
          </button>
          <button
            onClick={handleSave}
            className="flex items-center space-x-2 px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-neutral-200 transition-colors"
          >
            <Save size={16} />
            <span>Save Changes</span>
          </button>
        </div>
      </header>

      {/* Main Editor Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Tabs */}
        <div className="w-48 border-r border-neutral-900 bg-black p-4 space-y-1 overflow-y-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={clsx(
                  'w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-neutral-900 text-white'
                    : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900/50'
                )}
              >
                <Icon size={16} className={isActive ? 'text-white' : 'text-neutral-600'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="flex-1 p-8 overflow-y-auto bg-black">
          <div className="max-w-3xl">
            {activeTab === 'rules' && (
              <div>
                <h3 className="text-lg font-medium text-white mb-4">System Rules</h3>
                <p className="text-sm text-neutral-500 mb-6">Define the core instructions and constraints for the AI model.</p>
                {renderListEditor(localRules, setLocalRules, "e.g., Always use TypeScript and functional components...")}
              </div>
            )}

            {activeTab === 'context' && (
              <div>
                <h3 className="text-lg font-medium text-white mb-4">Context Folders</h3>
                <p className="text-sm text-neutral-500 mb-6">Specify which directories the AI should have access to.</p>
                {renderListEditor(localContext, setLocalContext, "e.g., /src/components or ./docs")}
              </div>
            )}

            {activeTab === 'ignore' && (
              <div>
                <h3 className="text-lg font-medium text-white mb-4">Ignore Patterns</h3>
                <p className="text-sm text-neutral-500 mb-6">Files and folders the AI should ignore (like .gitignore).</p>
                {renderListEditor(localIgnore, setLocalIgnore, "e.g., node_modules/ or *.log")}
              </div>
            )}

            {activeTab === 'tools' && (
              <div>
                <h3 className="text-lg font-medium text-white mb-4">Custom Tools</h3>
                <p className="text-sm text-neutral-500 mb-6">Define custom CLI commands or scripts the AI can execute.</p>
                <div className="text-center py-12 border border-dashed border-neutral-800 rounded-xl">
                  <Settings2 className="mx-auto h-8 w-8 text-neutral-700 mb-3" />
                  <p className="text-sm text-neutral-400">Tool configuration UI coming soon.</p>
                  <p className="text-xs text-neutral-600 mt-1">Edit via raw JSON for now.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
