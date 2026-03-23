import React, { useState } from 'react';
import { useProfiles } from '../hooks/useProfiles';
import { Plus, Search, Copy, Trash2, Edit2, Layers, AlertTriangle } from 'lucide-react';
import { ToolName } from '../types';
import clsx from 'clsx';

type ProfilesViewProps = ReturnType<typeof useProfiles> & {
  onEdit: (id: string) => void;
};

export function ProfilesView({ profiles, activeProfileId, setActiveProfileId, addProfile, deleteProfile, duplicateProfile, onEdit }: ProfilesViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileTool, setNewProfileTool] = useState<ToolName>('Cursor');
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const filteredProfiles = profiles.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const pendingDeleteProfile = profiles.find(p => p.id === pendingDeleteId);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProfileName.trim()) {
      addProfile(newProfileName.trim(), newProfileTool);
      setIsCreating(false);
      setNewProfileName('');
    }
  };

  const handleDeleteRequest = (id: string) => setPendingDeleteId(id);
  const handleDeleteCancel = () => setPendingDeleteId(null);
  const handleDeleteConfirm = () => {
    if (pendingDeleteId) {
      deleteProfile(pendingDeleteId);
      setPendingDeleteId(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-black">
      {/* Delete Confirmation Modal */}
      {pendingDeleteId && pendingDeleteProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div
            data-testid="delete-confirm-dialog"
            className="w-full max-w-md mx-4 bg-neutral-900 border border-neutral-700 rounded-xl p-6 shadow-2xl"
          >
            <div className="flex items-start space-x-3 mb-5">
              <AlertTriangle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-white">Delete profile?</h3>
                <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                  <span className="text-neutral-200 font-medium">"{pendingDeleteProfile.name}"</span> will
                  be permanently deleted. This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleDeleteCancel}
                data-testid="delete-cancel-btn"
                className="px-4 py-2 text-sm font-medium text-neutral-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                data-testid="delete-confirm-btn"
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Delete Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="flex items-center justify-between px-8 py-6 border-b border-neutral-900">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-white">Profiles</h2>
          <p className="text-sm text-neutral-400 mt-1">Manage your MCP configurations</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-neutral-200 transition-colors"
        >
          <Plus size={16} />
          <span>New Profile</span>
        </button>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        {/* Search */}
        <div className="relative mb-8 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-neutral-500" />
          </div>
          <input
            type="text"
            placeholder="Search profiles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-neutral-800 rounded-lg leading-5 bg-neutral-900/50 text-neutral-300 placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-white focus:border-white sm:text-sm transition-colors"
          />
        </div>

        {/* Create Form */}
        {isCreating && (
          <div className="mb-8 p-6 border border-neutral-800 rounded-xl bg-neutral-900/30">
            <h3 className="text-lg font-medium text-white mb-4">Create New Profile</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-1">Profile Name</label>
                <input
                  type="text"
                  autoFocus
                  required
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  className="block w-full px-3 py-2 border border-neutral-800 rounded-lg bg-black text-white focus:outline-none focus:ring-1 focus:ring-white sm:text-sm"
                  placeholder="e.g., React Frontend Project"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-1">Target Tool</label>
                <select
                  value={newProfileTool}
                  onChange={(e) => setNewProfileTool(e.target.value as ToolName)}
                  className="block w-full px-3 py-2 border border-neutral-800 rounded-lg bg-black text-white focus:outline-none focus:ring-1 focus:ring-white sm:text-sm"
                >
                  {['Cursor', 'Claude Code', 'Antigravity', 'Qwen CLI', 'Gemini CLI', 'Codex'].map(tool => (
                    <option key={tool} value={tool}>{tool}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 text-sm font-medium text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-neutral-200"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Grid */}
        {filteredProfiles.length === 0 && !isCreating ? (
          <div className="text-center py-20 border border-dashed border-neutral-800 rounded-xl">
            <Layers className="mx-auto h-12 w-12 text-neutral-600 mb-4" />
            <h3 className="text-lg font-medium text-white">No profiles found</h3>
            <p className="mt-1 text-sm text-neutral-400">Get started by creating a new MCP profile.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProfiles.map((profile) => (
              <div
                key={profile.id}
                className={clsx(
                  "group relative flex flex-col p-6 rounded-xl border transition-all duration-200",
                  activeProfileId === profile.id
                    ? "border-white bg-neutral-900/40"
                    : "border-neutral-800 bg-black hover:border-neutral-600 hover:bg-neutral-900/20"
                )}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-white truncate pr-4" title={profile.name}>
                      {profile.name}
                    </h3>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-neutral-800 text-neutral-300 mt-2">
                      {profile.tool}
                    </span>
                  </div>
                  
                  {/* Actions Menu */}
                  <div className="flex items-center space-x-0.5 opacity-0 group-hover:opacity-100 transition-all duration-150">
                    <button
                      onClick={() => onEdit(profile.id)}
                      className="p-1.5 text-neutral-500 hover:text-white rounded-md hover:bg-neutral-800 transition-all duration-150 hover:scale-110"
                      title="Edit"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => duplicateProfile(profile.id)}
                      className="p-1.5 text-neutral-500 hover:text-white rounded-md hover:bg-neutral-800 transition-all duration-150 hover:scale-110"
                      title="Duplicate"
                    >
                      <Copy size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteRequest(profile.id)}
                      className="p-1.5 text-neutral-500 hover:text-red-400 rounded-md hover:bg-red-950/40 transition-all duration-150 hover:scale-110"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="mt-auto pt-6 flex items-center justify-between text-xs text-neutral-500">
                  <span>Updated {new Date(profile.updatedAt).toLocaleDateString()}</span>
                  
                  {activeProfileId !== profile.id ? (
                    <button 
                      onClick={() => setActiveProfileId(profile.id)}
                      className="flex items-center space-x-1 text-neutral-400 hover:text-white font-medium"
                    >
                      <span>Set Active</span>
                    </button>
                  ) : (
                    <span className="flex items-center space-x-1 text-white font-medium">
                      <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
                      <span>Active</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
