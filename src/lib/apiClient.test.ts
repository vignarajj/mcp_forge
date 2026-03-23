import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { isApiAvailable, writeConfigToFile } from './apiClient';

describe('apiClient', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('isApiAvailable', () => {
    it('returns true when the API ping succeeds', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ ok: true });
      const result = await isApiAvailable();
      expect(result).toBe(true);
      expect(fetch).toHaveBeenCalledWith(
        '/api/ping',
        expect.objectContaining({ signal: expect.any(AbortSignal) })
      );
    });

    it('returns false when the API returns a non-ok status', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ ok: false });
      const result = await isApiAvailable();
      expect(result).toBe(false);
    });

    it('returns false when fetch throws (network error)', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'));
      const result = await isApiAvailable();
      expect(result).toBe(false);
    });

    it('returns false when fetch aborts (timeout)', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new DOMException('Aborted', 'AbortError'));
      const result = await isApiAvailable();
      expect(result).toBe(false);
    });
  });

  describe('writeConfigToFile', () => {
    it('returns ok:true when the API write succeeds', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true }),
      });
      const result = await writeConfigToFile('~/.cursor/mcp.json', '{}');
      expect(result).toEqual({ ok: true });
      expect(fetch).toHaveBeenCalledWith(
        '/api/write-file',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ path: '~/.cursor/mcp.json', content: '{}' }),
        })
      );
    });

    it('returns ok:false with error when API returns an error', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ ok: false, error: 'Path not allowed' }),
      });
      const result = await writeConfigToFile('~/secret/file.txt', '{}');
      expect(result.ok).toBe(false);
      expect(result.error).toBe('Path not allowed');
    });

    it('returns ok:false with error message on network failure', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Connection refused'));
      const result = await writeConfigToFile('~/.cursor/mcp.json', '{}');
      expect(result.ok).toBe(false);
      expect(result.error).toBe('Connection refused');
    });

    it('returns ok:false with generic message on non-Error throw', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce('bad');
      const result = await writeConfigToFile('~/.cursor/mcp.json', '{}');
      expect(result.ok).toBe(false);
      expect(result.error).toBe('Unknown error');
    });
  });
});
