import { describe, it, expect } from 'vitest';
import { getToolConfigInfo, generateMcpConfig, generateMcpConfigJson, generateMcpConfigToml } from './toolConfigs';
import { McpProfile } from '../types';

function makeProfile(overrides: Partial<McpProfile> = {}): McpProfile {
  return {
    id: 'p1', name: 'Test', tool: 'Cursor', rules: [], tools: [],
    contextFolders: [], ignorePatterns: [], projectSettings: {},
    createdAt: 0, updatedAt: 0, ...overrides,
  };
}

describe('getToolConfigInfo', () => {
  it('returns correct paths for Cursor', () => {
    const info = getToolConfigInfo('Cursor');
    expect(info.globalPath).toBe('~/.cursor/mcp.json');
    expect(info.projectPath).toBe('.cursor/mcp.json');
    expect(info.format).toBe('json');
  });

  it('returns correct paths for Claude Code', () => {
    const info = getToolConfigInfo('Claude Code');
    expect(info.globalPath).toBe('~/.claude.json');
    expect(info.format).toBe('json');
  });

  it('returns correct paths for Gemini CLI', () => {
    const info = getToolConfigInfo('Gemini CLI');
    expect(info.globalPath).toBe('~/.gemini/settings.json');
    expect(info.format).toBe('json');
  });

  it('returns correct paths for Codex', () => {
    const info = getToolConfigInfo('Codex');
    expect(info.globalPath).toBe('~/.codex/config.toml');
    expect(info.format).toBe('toml');
  });

  it('returns config for all 6 tools', () => {
    const tools = ['Cursor', 'Claude Code', 'Antigravity', 'Qwen CLI', 'Gemini CLI', 'Codex'] as const;
    for (const t of tools) {
      const info = getToolConfigInfo(t);
      expect(info.globalPath).toBeTruthy();
      expect(info.format).toMatch(/^(json|toml)$/);
    }
  });
});

describe('generateMcpConfigJson', () => {
  it('generates empty mcpServers for no tools', () => {
    const config = generateMcpConfigJson(makeProfile());
    const parsed = JSON.parse(config);
    expect(parsed).toEqual({ mcpServers: {} });
  });

  it('generates correct JSON with command and args', () => {
    const profile = makeProfile({
      tools: [{
        id: '1', name: 'github', description: '', command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-github'], env: {},
      }],
    });
    const parsed = JSON.parse(generateMcpConfigJson(profile));
    expect(parsed.mcpServers.github.command).toBe('npx');
    expect(parsed.mcpServers.github.args).toEqual(['-y', '@modelcontextprotocol/server-github']);
    expect(parsed.mcpServers.github.env).toBeUndefined();
  });

  it('includes env when present', () => {
    const profile = makeProfile({
      tools: [{
        id: '1', name: 'github', description: '', command: 'docker',
        args: ['run', '-i'], env: { GITHUB_TOKEN: 'abc123' },
      }],
    });
    const parsed = JSON.parse(generateMcpConfigJson(profile));
    expect(parsed.mcpServers.github.env.GITHUB_TOKEN).toBe('abc123');
  });

  it('skips tools with empty name or command', () => {
    const profile = makeProfile({
      tools: [
        { id: '1', name: '', description: '', command: 'npx', args: [], env: {} },
        { id: '2', name: 'valid', description: '', command: '', args: [], env: {} },
        { id: '3', name: 'ok', description: '', command: 'node', args: [], env: {} },
      ],
    });
    const parsed = JSON.parse(generateMcpConfigJson(profile));
    expect(Object.keys(parsed.mcpServers)).toEqual(['ok']);
  });

  it('omits args key when args array is empty', () => {
    const profile = makeProfile({
      tools: [{ id: '1', name: 'test', description: '', command: 'node', args: [], env: {} }],
    });
    const parsed = JSON.parse(generateMcpConfigJson(profile));
    expect(parsed.mcpServers.test).toEqual({ command: 'node' });
  });
});

describe('generateMcpConfigToml', () => {
  it('returns empty string for no tools', () => {
    expect(generateMcpConfigToml(makeProfile())).toBe('');
  });

  it('generates valid TOML sections', () => {
    const profile = makeProfile({
      tools: [{
        id: '1', name: 'github', description: '', command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-github'],
        env: { GITHUB_TOKEN: 'abc' },
      }],
    });
    const toml = generateMcpConfigToml(profile);
    expect(toml).toContain('[mcp_servers.github]');
    expect(toml).toContain('command = "npx"');
    expect(toml).toContain('args = ["-y", "@modelcontextprotocol/server-github"]');
    expect(toml).toContain('env.GITHUB_TOKEN = "abc"');
  });

  it('sanitizes server names with special characters', () => {
    const profile = makeProfile({
      tools: [{ id: '1', name: 'my server!', description: '', command: 'node', args: [], env: {} }],
    });
    const toml = generateMcpConfigToml(profile);
    expect(toml).toContain('[mcp_servers.my_server_]');
  });
});

describe('generateMcpConfig', () => {
  it('uses JSON format for Cursor', () => {
    const config = generateMcpConfig(makeProfile({ tool: 'Cursor' }));
    expect(() => JSON.parse(config)).not.toThrow();
  });

  it('uses TOML format for Codex', () => {
    const profile = makeProfile({
      tool: 'Codex',
      tools: [{ id: '1', name: 'test', description: '', command: 'node', args: [], env: {} }],
    });
    const config = generateMcpConfig(profile);
    expect(config).toContain('[mcp_servers.test]');
  });
});
