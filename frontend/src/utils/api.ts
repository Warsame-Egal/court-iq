import type { LeagueLeadersResponse } from '../types/league';
import type { BoxScoreResponse } from '../types/scoreboard';

export const getApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl === '' || envUrl === '/') return '';
  if (import.meta.env.DEV && envUrl === undefined) return '';
  return envUrl ?? '';
};

export const API_BASE_URL = getApiBaseUrl();

export const getWebSocketUrl = (path: string = '/api/v1/ws'): string => {
  const baseHost = getWebSocketHost();
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  return `${protocol}://${baseHost}${path}`;
};

export const getWebSocketHost = (): string => {
  const envUrl = import.meta.env.VITE_WS_URL;
  return envUrl?.replace(/^https?:\/\//, '') ?? '';
};

interface RetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
}

export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retryOptions: RetryOptions = {},
): Promise<Response> {
  const { maxRetries = 3, retryDelay = 1000, timeout = 30000 } = retryOptions;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeoutId);

      if (response.ok) return response;
      if (response.status >= 500 || response.status === 408) {
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
          continue;
        }
      }
      if (response.status === 429) {
        throw new Error('Too many requests — please wait a moment and try again.');
      }
      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (error instanceof Error && error.name === 'AbortError') {
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
          continue;
        }
        throw new Error(`Request timeout after ${timeout}ms`);
      }
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
        continue;
      }
    }
  }
  throw lastError || new Error('Request failed after all retries');
}

function parseFastApiErrorBody(text: string): string | null {
  try {
    const body = JSON.parse(text) as { detail?: unknown };
    const d = body.detail;
    if (typeof d === 'string') return d;
    if (Array.isArray(d)) {
      const msgs = d
        .filter((x): x is Record<string, unknown> => x != null && typeof x === 'object')
        .map(x => (typeof x.msg === 'string' ? x.msg : ''))
        .filter(Boolean);
      if (msgs.length) return msgs.join(' ');
    }
    if (d && typeof d === 'object' && d !== null && 'message' in d && typeof (d as { message: unknown }).message === 'string') {
      return (d as { message: string }).message;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export async function fetchJson<T>(
  url: string,
  options: RequestInit = {},
  retryOptions: RetryOptions = {},
): Promise<T> {
  const response = await fetchWithRetry(url, options, retryOptions);
  const text = await response.text();
  if (!response.ok) {
    const fromApi = parseFastApiErrorBody(text);
    throw new Error(fromApi ?? `Request failed (${response.status})`);
  }
  return JSON.parse(text) as T;
}

export async function fetchLeagueLeaders(statCategory: string, season?: string): Promise<LeagueLeadersResponse> {
  const params = new URLSearchParams({ stat_category: statCategory });
  if (season) params.append('season', season);
  return fetchJson(`${API_BASE_URL}/api/v1/league/leaders?${params.toString()}`, {}, { maxRetries: 3, retryDelay: 1000, timeout: 30000 });
}

export async function fetchBoxScore(gameId: string): Promise<BoxScoreResponse> {
  return fetchJson(`${API_BASE_URL}/api/v1/scoreboard/game/${gameId}/boxscore`, {}, { maxRetries: 2, timeout: 30000 });
}
