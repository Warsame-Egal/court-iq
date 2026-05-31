import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ReconnectingWebSocket } from './ReconnectingWebSocket';

type MockSocket = {
  url: string;
  onopen: (() => void) | null;
  onmessage: ((event: { data: string }) => void) | null;
  onerror: ((event: Event) => void) | null;
  onclose: ((event: { code: number; reason: string }) => void) | null;
  close: ReturnType<typeof vi.fn>;
};

class MockWebSocket {
  static instances: MockSocket[] = [];

  url: string;
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onclose: ((event: { code: number; reason: string }) => void) | null = null;
  close = vi.fn(() => {
    this.onclose?.({ code: 1000, reason: 'closed' });
  });

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
    queueMicrotask(() => this.onopen?.());
  }
}

describe('ReconnectingWebSocket', () => {
  beforeEach(() => {
    MockWebSocket.instances = [];
    vi.stubGlobal('WebSocket', MockWebSocket as unknown as typeof WebSocket);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('notifies subscribers with parsed JSON messages', () => {
    const socket = new ReconnectingWebSocket<{ score: number }, string>(key => `ws://${key}`);
    const listener = vi.fn();

    socket.subscribe(listener);
    socket.connect('game-1');

    const ws = MockWebSocket.instances[0];
    ws.onmessage?.({ data: JSON.stringify({ score: 42 }) });

    expect(listener).toHaveBeenCalledWith({ score: 42 });
  });

  it('schedules reconnect with exponential backoff after abnormal close', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);

    const socket = new ReconnectingWebSocket<{ ok: boolean }, string>(
      key => `ws://${key}`,
      { baseDelay: 1000, maxDelay: 30000, logLabel: 'Test WS' },
    );

    socket.connect('game-1');
    const first = MockWebSocket.instances[0];
    first.onclose?.({ code: 1006, reason: 'abnormal' });

    vi.advanceTimersByTime(1000);
    expect(MockWebSocket.instances.length).toBeGreaterThanOrEqual(2);
  });

  it('disconnect stops reconnect attempts', () => {
    const socket = new ReconnectingWebSocket<{ ok: boolean }, string>(key => `ws://${key}`, {
      baseDelay: 1000,
    });

    socket.connect('game-1');
    socket.disconnect();

    const ws = MockWebSocket.instances[0];
    ws.onclose?.({ code: 1006, reason: 'abnormal' });

    vi.advanceTimersByTime(5000);
    expect(MockWebSocket.instances).toHaveLength(1);
  });
});
