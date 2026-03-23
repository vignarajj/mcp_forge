import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { discoverMcpTools } from './mcpDiscovery';

describe('discoverMcpTools', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns discovered tools on success', async () => {
    const mockTools = [
      { name: 'search_docs', description: 'Search documentation' },
      { name: 'list_projects', description: 'List all projects' },
    ];

    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      json: async () => ({ ok: true, tools: mockTools }),
    });

    const result = await discoverMcpTools('npx', ['-y', '@supabase/mcp-server-supabase@latest'], {});
    expect(result.ok).toBe(true);
    expect(result.tools).toHaveLength(2);
    expect(result.tools[0].name).toBe('search_docs');
    expect(result.tools[1].name).toBe('list_projects');

    expect(fetch).toHaveBeenCalledWith(
      '/api/discover-tools',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          command: 'npx',
          args: ['-y', '@supabase/mcp-server-supabase@latest'],
          env: {},
        }),
      })
    );
  });

  it('returns empty tools array on server error', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      json: async () => ({ ok: false, tools: [], error: 'Timed out' }),
    });

    const result = await discoverMcpTools('npx', [], {});
    expect(result.ok).toBe(false);
    expect(result.tools).toEqual([]);
    expect(result.error).toBe('Timed out');
  });

  it('returns ok:false on network error', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Failed to fetch'));

    const result = await discoverMcpTools('node', ['server.js'], {});
    expect(result.ok).toBe(false);
    expect(result.tools).toEqual([]);
    expect(result.error).toBe('Failed to fetch');
  });

  it('passes env variables in the request body', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      json: async () => ({ ok: true, tools: [] }),
    });

    await discoverMcpTools('npx', ['-y', 'some-package'], { TOKEN: 'abc123' });

    const call = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse(call[1].body);
    expect(body.env).toEqual({ TOKEN: 'abc123' });
  });

  it('handles AbortError gracefully', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new DOMException('Aborted', 'AbortError'));
    const result = await discoverMcpTools('npx', [], {});
    expect(result.ok).toBe(false);
    expect(result.tools).toEqual([]);
  });
});
