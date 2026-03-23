#!/usr/bin/env node

import { execSync, spawn } from 'child_process';
import { existsSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { homedir } from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const root = resolve(__dirname, '..');

const distDir = resolve(root, 'dist');

// Build if dist doesn't exist
if (!existsSync(distDir)) {
  console.log('⚒  Building MCP Forge...');
  try {
    execSync('npm run build', { cwd: root, stdio: 'inherit' });
  } catch {
    console.error('Build failed. Please ensure all dependencies are installed (npm install).');
    process.exit(1);
  }
}

// ─── Allowed path prefixes for write-to-file (security guard) ────────────────
const ALLOWED_PREFIXES = [
  '.cursor/',
  '.claude.json',
  '.gemini/',
  '.codex/',
  '.antigravity/',
  '.qwen/',
];

function expandPath(p) {
  if (p.startsWith('~/')) {
    return resolve(homedir(), p.slice(2));
  }
  return p;
}

function isAllowedPath(rawPath) {
  const relative = rawPath.startsWith('~/')
    ? rawPath.slice(2)
    : null;
  if (!relative) return false;
  return ALLOWED_PREFIXES.some(prefix => relative.startsWith(prefix));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => (data += chunk));
    req.on('end', () => {
      try { resolve(JSON.parse(data)); } catch { reject(new Error('Invalid JSON')); }
    });
    req.on('error', reject);
  });
}

function sendJson(res, status, body) {
  const json = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(json);
}

// ─── MCP tools discovery via JSON-RPC over stdio ─────────────────────────────
function discoverTools(command, args, env) {
  return new Promise((resolve) => {
    const TIMEOUT_MS = 12000;
    let settled = false;
    const tools = [];

    const child = spawn(command, args, {
      env: { ...process.env, ...env },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let buffer = '';
    let initSent = false;
    let msgId = 1;

    const done = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try { child.kill(); } catch {}
      resolve(result);
    };

    const timer = setTimeout(() => done({ ok: false, tools: [], error: 'Timed out' }), TIMEOUT_MS);

    child.stdout.on('data', (chunk) => {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop(); // keep incomplete line

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const msg = JSON.parse(trimmed);

          // Server sent initialize result — now request tools/list
          if (msg.id === 1 && msg.result !== undefined && !initSent) {
            initSent = true;
            const toolsReq = JSON.stringify({ jsonrpc: '2.0', id: ++msgId, method: 'tools/list', params: {} });
            child.stdin.write(toolsReq + '\n');
          }

          // tools/list response
          if (msg.id === 2 && msg.result) {
            const list = msg.result.tools || [];
            for (const t of list) {
              tools.push({ name: t.name, description: t.description || '' });
            }
            done({ ok: true, tools });
          }
        } catch {
          // not JSON — skip
        }
      }
    });

    child.on('error', (err) => done({ ok: false, tools: [], error: err.message }));
    child.on('close', () => {
      if (!settled) done({ ok: tools.length > 0, tools });
    });

    // Send MCP initialize request
    const initReq = JSON.stringify({
      jsonrpc: '2.0',
      id: msgId,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'mcp-forge', version: '1.0.0' },
      },
    });
    child.stdin.write(initReq + '\n');
  });
}

// ─── Local API server (port 4174) ────────────────────────────────────────────
const API_PORT = 4174;

const apiServer = createServer(async (req, res) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    });
    res.end();
    return;
  }

  if (req.method === 'GET' && req.url === '/api/ping') {
    return sendJson(res, 200, { ok: true });
  }

  if (req.method === 'POST' && req.url === '/api/write-file') {
    try {
      const body = await readBody(req);
      const { path: rawPath, content } = body;

      if (!rawPath || typeof rawPath !== 'string' || typeof content !== 'string') {
        return sendJson(res, 400, { ok: false, error: 'Missing path or content' });
      }

      if (!isAllowedPath(rawPath)) {
        return sendJson(res, 403, { ok: false, error: `Path not allowed: ${rawPath}` });
      }

      const fullPath = expandPath(rawPath);
      const dir = dirname(fullPath);
      mkdirSync(dir, { recursive: true });
      writeFileSync(fullPath, content, 'utf8');
      return sendJson(res, 200, { ok: true });
    } catch (e) {
      return sendJson(res, 500, { ok: false, error: e.message });
    }
  }

  if (req.method === 'POST' && req.url === '/api/discover-tools') {
    try {
      const body = await readBody(req);
      const { command, args = [], env = {} } = body;

      if (!command || typeof command !== 'string') {
        return sendJson(res, 400, { ok: false, tools: [], error: 'Missing command' });
      }

      const result = await discoverTools(command, args, env);
      return sendJson(res, 200, result);
    } catch (e) {
      return sendJson(res, 500, { ok: false, tools: [], error: e.message });
    }
  }

  sendJson(res, 404, { ok: false, error: 'Not found' });
});

apiServer.listen(API_PORT, '127.0.0.1', () => {
  console.log(`🔧 MCP Forge API server running on http://localhost:${API_PORT}`);
});

// ─── Start Vite preview server ────────────────────────────────────────────────
console.log('🚀 Starting MCP Forge...');

const preview = spawn('npx', ['vite', 'preview', '--port', '4173', '--strictPort'], {
  cwd: root,
  stdio: 'pipe',
});

preview.stdout.on('data', (data) => {
  const output = data.toString();
  process.stdout.write(output);

  // Open browser once the server is ready
  if (output.includes('http')) {
    const urlMatch = output.match(/(https?:\/\/[^\s]+)/);
    const url = urlMatch ? urlMatch[1] : 'http://localhost:4173';
    openBrowser(url);
  }
});

preview.stderr.on('data', (data) => {
  process.stderr.write(data.toString());
});

preview.on('close', (code) => {
  apiServer.close();
  process.exit(code ?? 0);
});

// Graceful shutdown
process.on('SIGINT', () => {
  apiServer.close();
  preview.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  apiServer.close();
  preview.kill('SIGTERM');
  process.exit(0);
});

function openBrowser(url) {
  const platform = process.platform;
  try {
    if (platform === 'darwin') {
      execSync(`open "${url}"`);
    } else if (platform === 'win32') {
      execSync(`start "${url}"`);
    } else {
      execSync(`xdg-open "${url}"`);
    }
  } catch {
    console.log(`\n  Open in your browser: ${url}\n`);
  }
}
