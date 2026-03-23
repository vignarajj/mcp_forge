/**
 * mcpDiscovery.ts
 * Discovers tools exposed by an MCP server by calling the local API.
 * Uses relative /api/* URLs which work in both dev and CLI modes.
 */

import { McpToolInfo } from '../types';

export interface DiscoverToolsResult {
  ok: boolean;
  tools: McpToolInfo[];
  error?: string;
}

export async function discoverMcpTools(
  command: string,
  args: string[],
  env: Record<string, string>
): Promise<DiscoverToolsResult> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    const res = await fetch('/api/discover-tools', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command, args, env }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    const data = await res.json() as { ok: boolean; tools: McpToolInfo[]; error?: string };
    return data;
  } catch (e) {
    return {
      ok: false,
      tools: [],
      error: e instanceof Error ? e.message : 'Discovery failed',
    };
  }
}
