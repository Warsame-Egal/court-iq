export type ReconnectingWebSocketOptions = {
  maxReconnectAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  logLabel?: string;
};

export class ReconnectingWebSocket<T, K extends string = string> {
  private socket: WebSocket | null = null;
  private key: K | null = null;
  private listeners = new Set<(data: T) => void>();
  private shouldReconnect = true;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts: number;
  private readonly baseDelay: number;
  private readonly maxDelay: number;
  private readonly logLabel: string;
  private readonly buildUrl: (key: K) => string;

  constructor(
    buildUrl: (key: K) => string,
    options: ReconnectingWebSocketOptions = {},
  ) {
    this.buildUrl = buildUrl;
    this.maxReconnectAttempts = options.maxReconnectAttempts ?? 10;
    this.baseDelay = options.baseDelay ?? 1000;
    this.maxDelay = options.maxDelay ?? 30000;
    this.logLabel = options.logLabel ?? 'WebSocket';
  }

  private getReconnectDelay(): number {
    const exponential = Math.min(
      this.baseDelay * Math.pow(2, this.reconnectAttempts),
      this.maxDelay,
    );
    const jitter = exponential * 0.2 * Math.random();
    return exponential + jitter;
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(`Max ${this.logLabel} reconnect attempts reached`);
      return;
    }
    const delay = this.getReconnectDelay();
    this.reconnectAttempts++;
    console.info(
      `${this.logLabel} reconnecting in ${Math.round(delay / 1000)}s (attempt ${this.reconnectAttempts})`,
    );
    setTimeout(() => {
      if (this.shouldReconnect && this.key && !this.socket) {
        this.connect(this.key);
      }
    }, delay);
  }

  connect(key: K): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN && this.key === key) {
      return;
    }

    if (this.socket && this.key !== key) {
      this.disconnect();
    }

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    this.shouldReconnect = true;
    this.key = key;
    const url = this.buildUrl(key);
    this.socket = new WebSocket(url);

    this.socket.onopen = () => {
      this.reconnectAttempts = 0;
      console.info(`${this.logLabel} connected`);
    };

    this.socket.onmessage = event => {
      try {
        const data = JSON.parse(event.data) as T;
        this.listeners.forEach(callback => callback(data));
      } catch (error) {
        console.error(`[${this.logLabel}] Error parsing message:`, error, event.data);
      }
    };

    this.socket.onerror = event => {
      console.error(`${this.logLabel} connection error`, event);
    };

    this.socket.onclose = event => {
      console.info(
        `${this.logLabel} disconnected (code: ${event.code}, reason: ${event.reason || 'none'})`,
      );
      this.socket = null;
      if (this.shouldReconnect && this.key && event.code !== 1000) {
        this.scheduleReconnect();
      }
    };
  }

  subscribe(callback: (data: T) => void): void {
    this.listeners.add(callback);
  }

  unsubscribe(callback: (data: T) => void): void {
    this.listeners.delete(callback);
  }

  disconnect(): void {
    this.shouldReconnect = false;
    this.reconnectAttempts = 0;
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.key = null;
  }
}
