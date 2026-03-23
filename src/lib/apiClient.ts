/**
 * apiClient.ts
 * Communicates with the MCP Forge local API using relative URLs.
 *
 * In dev mode (npm run dev), the Vite mcpApiPlugin handles /api/* directly.
 * In CLI mode (mcp-forge), the standalone API server on port 4174 handles
 * it and the Vite preview proxy forwards /api/* there.
 */

const TIMEOUT_MS = 2500;

async function fetchWithTimeout(url: string, options?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

export async function isApiAvailable(): Promise<boolean> {
  try {
    const res = await fetchWithTimeout('/api/ping');
    return res.ok;
  } catch {
    return false;
  }
}

export interface WriteFileResult {
  ok: boolean;
  error?: string;
}

export async function writeConfigToFile(
  path: string,
  content: string
): Promise<WriteFileResult> {
  try {
    const res = await fetchWithTimeout('/api/write-file', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, content }),
    });
    const data = await res.json() as { ok: boolean; error?: string };
    return data;
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}
