import { Terminal, Code2, Sparkles, Box, Cpu } from 'lucide-react';
import { useProfiles } from '../hooks/useProfiles';
import { getToolConfigInfo } from '../lib/toolConfigs';
import { ToolName } from '../types';

type ToolsViewProps = ReturnType<typeof useProfiles>;

export function ToolsView({ profiles }: ToolsViewProps) {
  const tools = [
    { id: 'cursor', name: 'Cursor', icon: Terminal, desc: 'The AI-first Code Editor', count: profiles.filter(p => p.tool === 'Cursor').length },
    { id: 'claude', name: 'Claude Code', icon: Sparkles, desc: 'Anthropic\'s CLI coding assistant', count: profiles.filter(p => p.tool === 'Claude Code').length },
    { id: 'antigravity', name: 'Antigravity', icon: Box, desc: 'Next-gen coding harness', count: profiles.filter(p => p.tool === 'Antigravity').length },
    { id: 'qwen', name: 'Qwen CLI', icon: Cpu, desc: 'Alibaba\'s powerful local models', count: profiles.filter(p => p.tool === 'Qwen CLI').length },
    { id: 'gemini', name: 'Gemini CLI', icon: Sparkles, desc: 'Google\'s multimodal coding agent', count: profiles.filter(p => p.tool === 'Gemini CLI').length },
    { id: 'codex', name: 'Codex', icon: Code2, desc: 'OpenAI\'s original code model', count: profiles.filter(p => p.tool === 'Codex').length },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-black">
      <header className="flex items-center justify-between px-8 py-6 border-b border-neutral-900">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-white">Supported Tools</h2>
          <p className="text-sm text-neutral-400 mt-1">AI coding environments that support MCP</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <div key={tool.id} className="p-6 rounded-xl border border-neutral-800 bg-neutral-900/20 hover:border-neutral-700 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-neutral-800 rounded-lg">
                    <Icon size={20} className="text-white" />
                  </div>
                  <span className="text-xs font-medium text-neutral-500 bg-neutral-900 px-2 py-1 rounded-full">
                    {tool.count} Profiles
                  </span>
                </div>
                <h3 className="text-lg font-medium text-white mb-1">{tool.name}</h3>
                <p className="text-sm text-neutral-400">{tool.desc}</p>

                <div className="mt-4 pt-4 border-t border-neutral-800">
                  <p className="text-xs text-neutral-500 mb-1">Config path:</p>
                  <code className="text-xs text-neutral-300 bg-neutral-800 px-2 py-0.5 rounded" data-testid={`path-${tool.id}`}>
                    {getToolConfigInfo(tool.name as ToolName).globalPath}
                  </code>
                  <p className="text-xs text-neutral-600 mt-1">{getToolConfigInfo(tool.name as ToolName).format.toUpperCase()}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
