/**
 * mcpApiPlugin.ts
 * Vite plugin that serves the MCP Forge local API on the dev server.
 * This makes tool discovery and file-write work in `npm run dev`
 * without needing a separate CLI process.
 *
 * In CLI / preview mode, `bin/cli.js` runs a standalone API server on port 4174
 * and vite.config.ts proxies /api/* to it from the preview server.
 */

import type { Plugin } from 'vite';
import { spawn } from 'child_process';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname, resolve } from 'path';
import { homedir } from 'os';
import type { IncomingMessage, ServerResponse } from 'http';

// ─── Allowed path prefixes (security guard) ──────────────────────────────────
const ALLOWED_PREFIXES = [
  '.cursor/',
  '.claude.json',
  '.gemini/',
  '.codex/',
  '.antigravity/',
  '.qwen/',
];

function expandPath(p: string): string {
  if (p.startsWith('~/')) return resolve(homedir(), p.slice(2));
  return p;
}

function isAllowedPath(rawPath: string): boolean {
  const relative = rawPath.startsWith('~/') ? rawPath.slice(2) : null;
  if (!relative) return false;
  return ALLOWED_PREFIXES.some(prefix => relative.startsWith(prefix));
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  const json = JSON.stringify(body);
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(json);
}

function readBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk: Buffer) => (data += chunk.toString()));
    req.on('end', () => {
      try { resolve(JSON.parse(data)); } catch { reject(new Error('Invalid JSON')); }
    });
    req.on('error', reject);
  });
}

// ─── MCP tools discovery via JSON-RPC over stdio ─────────────────────────────
interface DiscoverResult {
  ok: boolean;
  tools: { name: string; description?: string }[];
  error?: string;
}

function discoverTools(command: string, args: string[], env: Record<string, string>): Promise<DiscoverResult> {
  return new Promise((resolve) => {
    const TIMEOUT_MS = 12000;
    let settled = false;
    const tools: { name: string; description?: string }[] = [];

    const child = spawn(command, args, {
      env: { ...process.env, ...env },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let buffer = '';
    let initSent = false;
    let msgId = 1;

    const done = (result: DiscoverResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try { child.kill(); } catch { /* ignore */ }
      resolve(result);
    };

    const timer = setTimeout(() => done({ ok: false, tools: [], error: 'Timed out waiting for server response' }), TIMEOUT_MS);

    child.stdout.on('data', (chunk: Buffer) => {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const msg = JSON.parse(trimmed) as { id?: number; result?: { tools?: { name: string; description?: string }[] } };

          // Initialize response received — now request tools/list
          if (msg.id === 1 && msg.result !== undefined && !initSent) {
            initSent = true;
            child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: ++msgId, method: 'tools/list', params: {} }) + '\n');
          }

          // tools/list response
          if (msg.id === 2 && msg.result) {
            const list = msg.result.tools ?? [];
            for (const t of list) {
              tools.push({ name: t.name, description: t.description });
            }
            done({ ok: true, tools });
          }
        } catch { /* not JSON, skip */ }
      }
    });

    child.on('error', (err: Error) => done({ ok: false, tools: [], error: err.message }));
    child.on('close', () => { if (!settled) done({ ok: tools.length > 0, tools }); });

    // Fire initialize request
    child.stdin.write(JSON.stringify({
      jsonrpc: '2.0',
      id: msgId,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'mcp-forge', version: '1.0.0' },
      },
    }) + '\n');
  });
}

// ─── Vite Plugin ─────────────────────────────────────────────────────────────
export function mcpApiPlugin(): Plugin {
  const handleRequest = async (
    req: IncomingMessage,
    res: ServerResponse,
    next: () => void,
  ) => {
    const url = req.url ?? '';

    if (req.method === 'GET' && url === '/api/ping') {
      return sendJson(res, 200, { ok: true });
    }

    if (req.method === 'POST' && url === '/api/write-file') {
      try {
        const body = await readBody(req);
        const rawPath = body.path as string;
        const content = body.content as string;

        if (!rawPath || typeof rawPath !== 'string' || typeof content !== 'string') {
          return sendJson(res, 400, { ok: false, error: 'Missing path or content' });
        }
        if (!isAllowedPath(rawPath)) {
          return sendJson(res, 403, { ok: false, error: `Path not allowed: ${rawPath}` });
        }

        const fullPath = expandPath(rawPath);
        mkdirSync(dirname(fullPath), { recursive: true });
        writeFileSync(fullPath, content, 'utf8');
        return sendJson(res, 200, { ok: true });
      } catch (e: unknown) {
        return sendJson(res, 500, { ok: false, error: (e as Error).message });
      }
    }

    if (req.method === 'POST' && url === '/api/discover-tools') {
      try {
        const body = await readBody(req);
        const command = body.command as string;
        const args = (body.args ?? []) as string[];
        const env = (body.env ?? {}) as Record<string, string>;

        if (!command || typeof command !== 'string') {
          return sendJson(res, 400, { ok: false, tools: [], error: 'Missing command' });
        }

        const result = await discoverTools(command, args, env);
        return sendJson(res, 200, result);
      } catch (e: unknown) {
        return sendJson(res, 500, { ok: false, tools: [], error: (e as Error).message });
      }
    }

    next();
  };

  return {
    name: 'mcp-api',
    configureServer(server) {
      server.middlewares.use(handleRequest);
    },
  };
}
