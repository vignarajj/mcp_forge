import { ToolName, ToolConfigInfo, McpProfile, McpTool } from '../types';

const TOOL_CONFIGS: Record<ToolName, ToolConfigInfo> = {
  'Cursor': {
    globalPath: '~/.cursor/mcp.json',
    projectPath: '.cursor/mcp.json',
    format: 'json',
    notes: 'Standalone JSON file. Restart Cursor after updating.',
  },
  'Claude Code': {
    globalPath: '~/.claude.json',
    projectPath: '.mcp.json',
    format: 'json',
    notes: 'Merge mcpServers into existing ~/.claude.json. Run "claude mcp list" to verify.',
  },
  'Antigravity': {
    globalPath: '~/.antigravity/mcp.json',
    projectPath: '.antigravity/mcp.json',
    format: 'json',
    notes: 'Config path may vary. Check Antigravity docs for your version.',
  },
  'Qwen CLI': {
    globalPath: '~/.qwen/mcp.json',
    projectPath: null,
    format: 'json',
    notes: 'Config path may vary. Check Qwen CLI docs for your version.',
  },
  'Gemini CLI': {
    globalPath: '~/.gemini/settings.json',
    projectPath: '.gemini/settings.json',
    format: 'json',
    notes: 'Merge mcpServers into existing settings.json. Run "/mcp list" inside Gemini CLI to verify.',
  },
  'Codex': {
    globalPath: '~/.codex/config.toml',
    projectPath: '.codex/config.toml',
    format: 'toml',
    notes: 'Codex uses TOML format. Add [mcp_servers.*] sections to config.toml.',
  },
};

export function getToolConfigInfo(tool: ToolName): ToolConfigInfo {
  return TOOL_CONFIGS[tool];
}

function buildMcpServersObject(tools: McpTool[]): Record<string, Record<string, unknown>> {
  const servers: Record<string, Record<string, unknown>> = {};
  for (const tool of tools) {
    if (!tool.name.trim() || !tool.command.trim()) continue;
    const entry: Record<string, unknown> = { command: tool.command };
    if (tool.args.length > 0) {
      entry.args = tool.args;
    }
    if (Object.keys(tool.env).length > 0) {
      entry.env = tool.env;
    }
    servers[tool.name] = entry;
  }
  return servers;
}

export function generateMcpConfigJson(profile: McpProfile): string {
  const servers = buildMcpServersObject(profile.tools);
  return JSON.stringify({ mcpServers: servers }, null, 2);
}

function escapeTomlString(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

export function generateMcpConfigToml(profile: McpProfile): string {
  const lines: string[] = [];
  for (const tool of profile.tools) {
    if (!tool.name.trim() || !tool.command.trim()) continue;
    const key = tool.name.replace(/[^a-zA-Z0-9_-]/g, '_');
    lines.push(`[mcp_servers.${key}]`);
    lines.push(`command = "${escapeTomlString(tool.command)}"`);
    if (tool.args.length > 0) {
      const argsStr = tool.args.map(a => `"${escapeTomlString(a)}"`).join(', ');
      lines.push(`args = [${argsStr}]`);
    }
    if (Object.keys(tool.env).length > 0) {
      for (const [k, v] of Object.entries(tool.env)) {
        lines.push(`env.${k} = "${escapeTomlString(v)}"`);
      }
    }
    lines.push('');
  }
  return lines.join('\n').trim();
}

export function generateMcpConfig(profile: McpProfile): string {
  const config = getToolConfigInfo(profile.tool);
  if (config.format === 'toml') {
    return generateMcpConfigToml(profile);
  }
  return generateMcpConfigJson(profile);
}
