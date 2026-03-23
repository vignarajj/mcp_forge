import { describe, it, expect } from 'vitest';
import { validateMcpConfig } from './mcpValidator';
import { McpProfile } from '../types';

function makeProfile(overrides: Partial<McpProfile> = {}): McpProfile {
  return {
    id: 'p1', name: 'Test', tool: 'Cursor', rules: [], tools: [],
    contextFolders: [], ignorePatterns: [], projectSettings: {},
    createdAt: 0, updatedAt: 0, ...overrides,
  };
}

describe('validateMcpConfig', () => {
  it('returns error when no servers are defined', () => {
    const result = validateMcpConfig(makeProfile());
    expect(result.valid).toBe(false);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].severity).toBe('error');
    expect(result.issues[0].message).toContain('No MCP servers defined');
  });

  it('returns valid for a well-formed server', () => {
    const result = validateMcpConfig(makeProfile({
      tools: [{ id: '1', name: 'github', description: '', command: 'npx', args: ['-y', 'pkg'], env: {} }],
    }));
    expect(result.valid).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it('reports error for missing server name', () => {
    const result = validateMcpConfig(makeProfile({
      tools: [{ id: '1', name: '', description: '', command: 'npx', args: [], env: {} }],
    }));
    expect(result.valid).toBe(false);
    expect(result.issues.some(i => i.message.includes('Name is required'))).toBe(true);
  });

  it('reports error for missing command', () => {
    const result = validateMcpConfig(makeProfile({
      tools: [{ id: '1', name: 'test', description: '', command: '', args: [], env: {} }],
    }));
    expect(result.valid).toBe(false);
    expect(result.issues.some(i => i.message.includes('Command is required'))).toBe(true);
  });

  it('reports error for duplicate server names', () => {
    const result = validateMcpConfig(makeProfile({
      tools: [
        { id: '1', name: 'github', description: '', command: 'npx', args: [], env: {} },
        { id: '2', name: 'github', description: '', command: 'node', args: [], env: {} },
      ],
    }));
    expect(result.valid).toBe(false);
    expect(result.issues.some(i => i.message.includes('Duplicate name'))).toBe(true);
  });

  it('warns about spaces in server name', () => {
    const result = validateMcpConfig(makeProfile({
      tools: [{ id: '1', name: 'my server', description: '', command: 'node', args: [], env: {} }],
    }));
    expect(result.valid).toBe(true); // warnings don't invalidate
    expect(result.issues.some(i => i.severity === 'warning' && i.message.includes('spaces'))).toBe(true);
  });

  it('warns about npx without -y flag', () => {
    const result = validateMcpConfig(makeProfile({
      tools: [{ id: '1', name: 'test', description: '', command: 'npx', args: ['pkg'], env: {} }],
    }));
    expect(result.valid).toBe(true);
    expect(result.issues.some(i => i.severity === 'warning' && i.message.includes('-y flag'))).toBe(true);
  });

  it('does not warn about npx when -y flag is present', () => {
    const result = validateMcpConfig(makeProfile({
      tools: [{ id: '1', name: 'test', description: '', command: 'npx', args: ['-y', 'pkg'], env: {} }],
    }));
    expect(result.issues).toHaveLength(0);
  });

  it('does not warn about npx when --yes flag is present', () => {
    const result = validateMcpConfig(makeProfile({
      tools: [{ id: '1', name: 'test', description: '', command: 'npx', args: ['--yes', 'pkg'], env: {} }],
    }));
    expect(result.issues).toHaveLength(0);
  });

  it('reports error for empty env key', () => {
    const result = validateMcpConfig(makeProfile({
      tools: [{ id: '1', name: 'test', description: '', command: 'node', args: [], env: { '': 'val' } }],
    }));
    expect(result.valid).toBe(false);
    expect(result.issues.some(i => i.message.includes('empty key'))).toBe(true);
  });

  it('warns about empty env value', () => {
    const result = validateMcpConfig(makeProfile({
      tools: [{ id: '1', name: 'test', description: '', command: 'node', args: [], env: { API_KEY: '' } }],
    }));
    expect(result.valid).toBe(true);
    expect(result.issues.some(i => i.severity === 'warning' && i.message.includes('empty value'))).toBe(true);
  });

  it('handles multiple errors and warnings together', () => {
    const result = validateMcpConfig(makeProfile({
      tools: [
        { id: '1', name: '', description: '', command: '', args: [], env: {} },
        { id: '2', name: 'ok', description: '', command: 'npx', args: ['pkg'], env: { KEY: '' } },
      ],
    }));
    expect(result.valid).toBe(false);
    const errors = result.issues.filter(i => i.severity === 'error');
    const warnings = result.issues.filter(i => i.severity === 'warning');
    expect(errors.length).toBeGreaterThanOrEqual(2);
    expect(warnings.length).toBeGreaterThanOrEqual(1);
  });
});
