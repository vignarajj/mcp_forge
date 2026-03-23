import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useProfiles } from '../hooks/useProfiles';
import { McpTool, McpToolInfo } from '../types';
import {
  Save, Code, Settings2, FolderOpen, ShieldAlert, Plus, Trash2, Rocket,
  Copy, CheckCircle2, AlertTriangle, XCircle, Loader2, ChevronDown, ChevronUp,
  Zap,
} from 'lucide-react';
import { generateMcpConfig, getToolConfigInfo } from '../lib/toolConfigs';
import { validateMcpConfig } from '../lib/mcpValidator';
import { isApiAvailable, writeConfigToFile } from '../lib/apiClient';
import { discoverMcpTools } from '../lib/mcpDiscovery';
import clsx from 'clsx';

type EditorViewProps = ReturnType<typeof useProfiles>;

function createEmptyServer(): McpTool {
  return { id: crypto.randomUUID(), name: '', description: '', command: '', args: [], env: {} };
}

// Expand ~ to a readable label for the confirm dialog
function formatPath(p: string) {
  return p.replace('~', '~');
}

type DiscoveryStatus = 'idle' | 'loading' | 'done' | 'error';

interface DiscoveryState {
  status: DiscoveryStatus;
  tools: McpToolInfo[];
  error?: string;
  expanded: boolean;
}

type DeployStatus = 'idle' | 'confirming' | 'loading' | 'success' | 'error' | 'unavailable';

export function EditorView({ profiles, activeProfileId, updateProfile }: EditorViewProps) {
  const activeProfile = profiles.find(p => p.id === activeProfileId);
  const [activeTab, setActiveTab] = useState<'rules' | 'tools' | 'context' | 'ignore' | 'deploy'>('rules');

  const [localRules, setLocalRules] = useState<string[]>([]);
  const [localContext, setLocalContext] = useState<string[]>([]);
  const [localIgnore, setLocalIgnore] = useState<string[]>([]);
  const [localTools, setLocalTools] = useState<McpTool[]>([]);
  const [copied, setCopied] = useState(false);

  // Feature 1: Save toast
  const [saved, setSaved] = useState(false);

  // Feature 2: Deploy state
  const [deployStatus, setDeployStatus] = useState<DeployStatus>('idle');
  const [deployError, setDeployError] = useState<string>('');

  // Feature 3: Per-server discovery state (keyed by server id)
  const [discoveryMap, setDiscoveryMap] = useState<Record<string, DiscoveryState>>({});

  // MCP server removal confirmation
  const [pendingRemoveIndex, setPendingRemoveIndex] = useState<number | null>(null);

  useEffect(() => {
    if (activeProfile) {
      setLocalRules(activeProfile.rules || []);
      setLocalContext(activeProfile.contextFolders || []);
      setLocalIgnore(activeProfile.ignorePatterns || []);
      setLocalTools(activeProfile.tools || []);
      setSaved(false);
      setDeployStatus('idle');
      setDiscoveryMap({});
    }
  }, [activeProfile?.id]);

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

  // Feature 1: Save with toast
  const handleSave = () => {
    updateProfile(activeProfile.id, {
      rules: localRules.filter(r => r.trim() !== ''),
      contextFolders: localContext.filter(c => c.trim() !== ''),
      ignorePatterns: localIgnore.filter(i => i.trim() !== ''),
      tools: localTools,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const profileForConfig = { ...activeProfile, tools: localTools };
  const validation = useMemo(() => validateMcpConfig(profileForConfig), [localTools]);
  const configOutput = useMemo(() => generateMcpConfig(profileForConfig), [localTools, activeProfile.tool]);
  const configInfo = getToolConfigInfo(activeProfile.tool);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(configOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Feature 2: Deploy to file
  const handleDeployClick = async () => {
    if (deployStatus === 'confirming') {
      // User confirmed — proceed
      setDeployStatus('loading');
      const apiAvailable = await isApiAvailable();
      if (!apiAvailable) {
        setDeployStatus('unavailable');
        return;
      }
      const result = await writeConfigToFile(configInfo.globalPath, configOutput);
      if (result.ok) {
        setDeployStatus('success');
        setTimeout(() => setDeployStatus('idle'), 4000);
      } else {
        setDeployStatus('error');
        setDeployError(result.error || 'Write failed');
        setTimeout(() => setDeployStatus('idle'), 4000);
      }
    } else {
      setDeployStatus('confirming');
    }
  };

  const handleDeployCancel = () => setDeployStatus('idle');

  // Feature 3: Discover tools
  const handleDiscover = useCallback(async (tool: McpTool) => {
    if (!tool.command.trim()) return;
    setDiscoveryMap(prev => ({
      ...prev,
      [tool.id]: { status: 'loading', tools: [], expanded: false },
    }));
    const result = await discoverMcpTools(tool.command, tool.args, tool.env);
    setDiscoveryMap(prev => ({
      ...prev,
      [tool.id]: {
        status: result.ok ? 'done' : 'error',
        tools: result.tools,
        error: result.error,
        expanded: false,
      },
    }));
  }, []);

  const toggleDiscoveryExpanded = (serverId: string) => {
    setDiscoveryMap(prev => ({
      ...prev,
      [serverId]: { ...prev[serverId], expanded: !prev[serverId]?.expanded },
    }));
  };

  const tabs = [
    { id: 'rules', label: 'Rules', icon: ShieldAlert },
    { id: 'tools', label: 'MCP Servers', icon: Settings2 },
    { id: 'context', label: 'Context Folders', icon: FolderOpen },
    { id: 'ignore', label: 'Ignore Patterns', icon: Trash2 },
    { id: 'deploy', label: 'Deploy', icon: Rocket },
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
            onChange={(e) => { const n = [...items]; n[index] = e.target.value; setItems(n); }}
            placeholder={placeholder}
            className="flex-1 min-h-[60px] p-3 bg-neutral-900 border border-neutral-800 rounded-lg text-sm text-white focus:outline-none focus:border-neutral-600 resize-y"
          />
          <button onClick={() => setItems(items.filter((_, i) => i !== index))} className="p-2 text-neutral-500 hover:text-red-400 rounded-lg hover:bg-neutral-900">
            <Trash2 size={16} />
          </button>
        </div>
      ))}
      <button onClick={() => setItems([...items, ''])} className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-neutral-400 hover:text-white border border-dashed border-neutral-800 rounded-lg hover:border-neutral-600 w-full justify-center transition-colors">
        <Plus size={16} /><span>Add Item</span>
      </button>
    </div>
  );

  const updateTool = (index: number, updates: Partial<McpTool>) => {
    setLocalTools(prev => prev.map((t, i) => i === index ? { ...t, ...updates } : t));
  };

  const removeTool = (index: number) => {
    setPendingRemoveIndex(index);
  };

  const confirmRemoveTool = () => {
    if (pendingRemoveIndex !== null) {
      setLocalTools(prev => prev.filter((_, i) => i !== pendingRemoveIndex));
      setPendingRemoveIndex(null);
    }
  };

  const cancelRemoveTool = () => setPendingRemoveIndex(null);

  const addEnvVar = (index: number) => {
    setLocalTools(prev => prev.map((t, i) => i === index ? { ...t, env: { ...t.env, '': '' } } : t));
  };

  const updateEnvVar = (toolIndex: number, oldKey: string, newKey: string, newValue: string) => {
    setLocalTools(prev => prev.map((t, i) => {
      if (i !== toolIndex) return t;
      const newEnv = { ...t.env };
      if (oldKey !== newKey) delete newEnv[oldKey];
      newEnv[newKey] = newValue;
      return { ...t, env: newEnv };
    }));
  };

  const removeEnvVar = (toolIndex: number, key: string) => {
    setLocalTools(prev => prev.map((t, i) => {
      if (i !== toolIndex) return t;
      const newEnv = { ...t.env };
      delete newEnv[key];
      return { ...t, env: newEnv };
    }));
  };

  // ─── Render tool discovery badges for a server ───────────────────────────
  const renderDiscovery = (tool: McpTool) => {
    const disc = discoveryMap[tool.id];
    const PREVIEW_COUNT = 8;

    return (
      <div className="pt-3 border-t border-neutral-800/60 mt-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-neutral-400 flex items-center space-x-1.5">
            <Zap size={12} className="text-neutral-500" />
            <span>Available Tools</span>
            {disc?.status === 'done' && disc.tools.length > 0 && (
              <span
                className="px-1.5 py-0.5 bg-neutral-800 text-neutral-300 rounded text-xs"
                data-testid="tool-count-badge"
              >
                {disc.tools.length}
              </span>
            )}
          </span>
          <button
            onClick={() => handleDiscover(tool)}
            disabled={disc?.status === 'loading' || !tool.command.trim()}
            className="flex items-center space-x-1 text-xs text-neutral-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            data-testid="discover-tools-btn"
          >
            {disc?.status === 'loading'
              ? <><Loader2 size={11} className="animate-spin" /><span>Discovering…</span></>
              : <><Zap size={11} /><span>Discover Tools</span></>
            }
          </button>
        </div>

        {disc?.status === 'error' && (
          <p className="text-xs text-red-400" data-testid="discovery-error">{disc.error}</p>
        )}

        {disc?.status === 'done' && disc.tools.length === 0 && (
          <p className="text-xs text-neutral-500">No tools found from this server.</p>
        )}

        {disc?.status === 'done' && disc.tools.length > 0 && (
          <div>
            <div className="flex flex-wrap gap-1.5" data-testid="tool-badges">
              {(disc.expanded ? disc.tools : disc.tools.slice(0, PREVIEW_COUNT)).map(t => (
                <span
                  key={t.name}
                  title={t.description}
                  className="px-2 py-0.5 bg-neutral-800 text-neutral-300 rounded text-xs font-mono hover:bg-neutral-700 transition-colors cursor-default"
                >
                  {t.name}
                </span>
              ))}
            </div>
            {disc.tools.length > PREVIEW_COUNT && (
              <button
                onClick={() => toggleDiscoveryExpanded(tool.id)}
                className="flex items-center space-x-1 mt-2 text-xs text-neutral-500 hover:text-white transition-colors"
                data-testid="toggle-expand-btn"
              >
                {disc.expanded
                  ? <><ChevronUp size={12} /><span>Show less</span></>
                  : <><ChevronDown size={12} /><span>Show {disc.tools.length - PREVIEW_COUNT} more</span></>
                }
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-black">
      <header className="flex items-center justify-between px-8 py-6 border-b border-neutral-900">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-white flex items-center space-x-3">
            <span>{activeProfile.name}</span>
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-neutral-800 text-neutral-300">{activeProfile.tool}</span>
          </h2>
          <p className="text-sm text-neutral-500 mt-1">Editing MCP configuration</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => {
              const json = JSON.stringify(activeProfile, null, 2);
              const blob = new Blob([json], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a'); a.href = url;
              a.download = `${activeProfile.name.toLowerCase().replace(/\s+/g, '-')}.mcp.json`;
              a.click();
            }}
            className="px-4 py-2 border border-neutral-800 text-white rounded-lg text-sm font-medium hover:bg-neutral-900 transition-colors"
          >Export JSON</button>

          {/* Feature 1: Save button with toast */}
          <button
            onClick={handleSave}
            data-testid="save-btn"
            className={clsx(
              'flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              saved
                ? 'bg-green-600 text-white'
                : 'bg-white text-black hover:bg-neutral-200'
            )}
          >
            {saved
              ? <><CheckCircle2 size={16} /><span>Saved!</span></>
              : <><Save size={16} /><span>Save Changes</span></>
            }
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-48 border-r border-neutral-900 bg-black p-4 space-y-1 overflow-y-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={clsx(
                'w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive ? 'bg-neutral-900 text-white' : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900/50'
              )}>
                <Icon size={16} className={isActive ? 'text-white' : 'text-neutral-600'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

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

            {/* === MCP Servers Tab === */}
            {activeTab === 'tools' && (
              <div>
                <h3 className="text-lg font-medium text-white mb-4">MCP Servers</h3>
                <p className="text-sm text-neutral-500 mb-6">Define MCP server entries for your <span className="text-white font-medium">{activeProfile.tool}</span> configuration.</p>

                <div className="space-y-6">
                  {localTools.map((tool, index) => (
                    <div key={tool.id} className="p-5 border border-neutral-800 rounded-xl bg-neutral-900/20 space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium text-neutral-500">Server #{index + 1}</span>
                        <button onClick={() => removeTool(index)} className="p-1 text-neutral-500 hover:text-red-400" title="Remove server">
                          <Trash2 size={14} />
                        </button>
                      </div>

                      {/* Inline removal confirmation */}
                      {pendingRemoveIndex === index && (
                        <div className="flex items-center justify-between p-3 rounded-lg bg-red-950/30 border border-red-900/40" data-testid="server-remove-confirm">
                          <div className="flex items-center space-x-2">
                            <AlertTriangle size={13} className="text-red-400" />
                            <span className="text-xs text-red-300">Remove this server?</span>
                          </div>
                          <div className="flex space-x-2">
                            <button onClick={cancelRemoveTool} data-testid="server-remove-cancel" className="text-xs text-neutral-400 hover:text-white px-2 py-1">Cancel</button>
                            <button onClick={confirmRemoveTool} data-testid="server-remove-confirm-btn" className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700">Remove</button>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-neutral-400 mb-1">Server Name</label>
                          <input value={tool.name} onChange={e => updateTool(index, { name: e.target.value })}
                            placeholder="e.g., github" className="block w-full px-3 py-2 border border-neutral-800 rounded-lg bg-black text-white text-sm focus:outline-none focus:ring-1 focus:ring-white" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-neutral-400 mb-1">Command</label>
                          <input value={tool.command} onChange={e => updateTool(index, { command: e.target.value })}
                            placeholder="e.g., npx" className="block w-full px-3 py-2 border border-neutral-800 rounded-lg bg-black text-white text-sm focus:outline-none focus:ring-1 focus:ring-white" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-neutral-400 mb-1">Arguments (comma-separated)</label>
                        <input value={tool.args.join(', ')}
                          onChange={e => updateTool(index, { args: e.target.value.split(',').map(a => a.trim()).filter(Boolean) })}
                          placeholder="e.g., -y, @modelcontextprotocol/server-github"
                          className="block w-full px-3 py-2 border border-neutral-800 rounded-lg bg-black text-white text-sm focus:outline-none focus:ring-1 focus:ring-white" />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-medium text-neutral-400">Environment Variables</label>
                          <button onClick={() => addEnvVar(index)} className="text-xs text-neutral-400 hover:text-white flex items-center space-x-1">
                            <Plus size={12} /><span>Add Variable</span>
                          </button>
                        </div>
                        {Object.entries(tool.env).map(([key, value]: [string, string], envIdx) => (
                          <div key={envIdx} className="flex items-center space-x-2 mb-2">
                            <input value={key} onChange={e => updateEnvVar(index, key, e.target.value, value)} placeholder="KEY"
                              className="w-1/3 px-2 py-1.5 border border-neutral-800 rounded bg-black text-white text-xs focus:outline-none focus:ring-1 focus:ring-white" />
                            <span className="text-neutral-600">=</span>
                            <input value={value} onChange={e => updateEnvVar(index, key, key, e.target.value)} placeholder="value"
                              className="flex-1 px-2 py-1.5 border border-neutral-800 rounded bg-black text-white text-xs focus:outline-none focus:ring-1 focus:ring-white" />
                            <button onClick={() => removeEnvVar(index, key)} className="text-neutral-500 hover:text-red-400"><Trash2 size={12} /></button>
                          </div>
                        ))}
                      </div>

                      {/* Feature 3: Tool discovery */}
                      {renderDiscovery(tool)}
                    </div>
                  ))}

                  <button onClick={() => setLocalTools([...localTools, createEmptyServer()])}
                    className="flex items-center space-x-2 px-4 py-3 text-sm font-medium text-neutral-400 hover:text-white border border-dashed border-neutral-800 rounded-lg hover:border-neutral-600 w-full justify-center transition-colors">
                    <Plus size={16} /><span>Add MCP Server</span>
                  </button>
                </div>
              </div>
            )}

            {/* === Deploy Tab === */}
            {activeTab === 'deploy' && (
              <div>
                <h3 className="text-lg font-medium text-white mb-4">Deploy Configuration</h3>
                <p className="text-sm text-neutral-500 mb-6">Generated {configInfo.format.toUpperCase()} config for <span className="text-white font-medium">{activeProfile.tool}</span>. Copy and paste into the target file.</p>

                {/* Validation status */}
                <div className={clsx('p-4 rounded-xl border mb-6', validation.valid ? 'border-green-900/50 bg-green-950/20' : 'border-red-900/50 bg-red-950/20')} data-testid="validation-status">
                  <div className="flex items-center space-x-2 mb-2">
                    {validation.valid
                      ? <><CheckCircle2 size={16} className="text-green-400" /><span className="text-sm font-medium text-green-400">Valid MCP Configuration</span></>
                      : <><XCircle size={16} className="text-red-400" /><span className="text-sm font-medium text-red-400">Invalid MCP Configuration</span></>
                    }
                  </div>
                  {validation.issues.length > 0 && (
                    <ul className="space-y-1 mt-2">
                      {validation.issues.map((issue, i) => (
                        <li key={i} className="flex items-start space-x-2 text-xs">
                          {issue.severity === 'error'
                            ? <XCircle size={12} className="text-red-400 mt-0.5 flex-shrink-0" />
                            : <AlertTriangle size={12} className="text-yellow-400 mt-0.5 flex-shrink-0" />
                          }
                          <span className={issue.severity === 'error' ? 'text-red-300' : 'text-yellow-300'}>{issue.message}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Target file paths */}
                <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/20 mb-6">
                  <h4 className="text-sm font-medium text-white mb-3">Target File Paths</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-400">Global config:</span>
                      <code className="text-neutral-200 bg-neutral-800 px-2 py-0.5 rounded" data-testid="global-path">{configInfo.globalPath}</code>
                    </div>
                    {configInfo.projectPath && (
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-400">Project config:</span>
                        <code className="text-neutral-200 bg-neutral-800 px-2 py-0.5 rounded">{configInfo.projectPath}</code>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-400">Format:</span>
                      <span className="text-neutral-200">{configInfo.format.toUpperCase()}</span>
                    </div>
                  </div>
                  <p className="text-xs text-neutral-500 mt-3">{configInfo.notes}</p>
                </div>

                {/* Feature 2: Deploy to file button + confirmation */}
                <div className="mb-6 p-4 rounded-xl border border-neutral-800 bg-neutral-900/20" data-testid="deploy-section">
                  <h4 className="text-sm font-medium text-white mb-3">Write to File</h4>

                  {deployStatus === 'idle' && (
                    <div>
                      <p className="text-xs text-neutral-500 mb-3">
                        Directly write the config to the global path. Requires the MCP Forge CLI to be running.
                      </p>
                      <button
                        onClick={handleDeployClick}
                        disabled={!validation.valid}
                        data-testid="deploy-btn"
                        className="flex items-center space-x-2 px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-neutral-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Rocket size={14} /><span>Deploy to Global Config</span>
                      </button>
                      {!validation.valid && (
                        <p className="text-xs text-red-400 mt-2">Fix validation errors above before deploying.</p>
                      )}
                    </div>
                  )}

                  {deployStatus === 'confirming' && (
                    <div data-testid="deploy-confirm-dialog">
                      <div className="flex items-start space-x-2 mb-3 p-3 rounded-lg bg-yellow-950/30 border border-yellow-900/40">
                        <AlertTriangle size={14} className="text-yellow-400 flex-shrink-0 mt-0.5" />
                        <div className="text-xs text-yellow-300">
                          <p className="font-medium mb-1">This will overwrite:</p>
                          <code className="block text-yellow-200 bg-yellow-950/50 px-2 py-1 rounded mt-1" data-testid="confirm-path">
                            {formatPath(configInfo.globalPath)}
                          </code>
                          {validation.issues.some(i => i.severity === 'warning') && (
                            <p className="mt-2 text-yellow-400">Your config has warnings — review them above.</p>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-3">
                        <button
                          onClick={handleDeployClick}
                          data-testid="confirm-deploy-btn"
                          className="flex items-center space-x-2 px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-neutral-200 transition-colors"
                        >
                          <Rocket size={14} /><span>Confirm & Write</span>
                        </button>
                        <button
                          onClick={handleDeployCancel}
                          data-testid="cancel-deploy-btn"
                          className="px-4 py-2 border border-neutral-700 text-neutral-300 rounded-lg text-sm font-medium hover:bg-neutral-900 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {deployStatus === 'loading' && (
                    <div className="flex items-center space-x-2 text-sm text-neutral-400" data-testid="deploy-loading">
                      <Loader2 size={16} className="animate-spin" />
                      <span>Writing file…</span>
                    </div>
                  )}

                  {deployStatus === 'success' && (
                    <div className="flex items-center space-x-2 text-sm text-green-400" data-testid="deploy-success">
                      <CheckCircle2 size={16} />
                      <span>Config written to <code className="text-green-300 text-xs">{configInfo.globalPath}</code></span>
                    </div>
                  )}

                  {deployStatus === 'error' && (
                    <div className="flex items-start space-x-2 text-sm text-red-400" data-testid="deploy-error">
                      <XCircle size={16} className="flex-shrink-0 mt-0.5" />
                      <span>Write failed: {deployError}</span>
                    </div>
                  )}

                  {deployStatus === 'unavailable' && (
                    <div className="flex items-start space-x-2 text-sm text-neutral-400" data-testid="deploy-unavailable">
                      <AlertTriangle size={16} className="text-yellow-500 flex-shrink-0 mt-0.5" />
                      <span>API not available — run via <code className="text-neutral-300 text-xs">mcp-forge</code> CLI to enable write-to-file. Copy the config manually below.</span>
                    </div>
                  )}
                </div>

                {/* Generated config output */}
                <div className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-neutral-400">Generated Config</span>
                    <button onClick={handleCopy} className="flex items-center space-x-1.5 px-3 py-1.5 bg-neutral-800 text-white rounded-md text-xs font-medium hover:bg-neutral-700 transition-colors">
                      {copied ? <><CheckCircle2 size={12} /><span>Copied!</span></> : <><Copy size={12} /><span>Copy to Clipboard</span></>}
                    </button>
                  </div>
                  <pre className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-neutral-300 overflow-x-auto whitespace-pre max-h-96" data-testid="config-output">
                    {configOutput}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
