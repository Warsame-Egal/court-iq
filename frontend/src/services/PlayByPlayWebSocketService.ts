import { PlayByPlayResponse } from '../types/gameDetail';
import { getWebSocketUrl } from '../utils/api';
import { ReconnectingWebSocket } from './ReconnectingWebSocket';

const playByPlaySocket = new ReconnectingWebSocket<PlayByPlayResponse, string>(
  gameId => getWebSocketUrl(`/api/v1/ws/${gameId}/play-by-play`),
  { logLabel: 'Play-by-play WebSocket' },
);

class PlayByPlayWebSocketService {
  connect(gameId: string): void {
    playByPlaySocket.connect(gameId);
  }

  subscribe(callback: (data: PlayByPlayResponse) => void): void {
    playByPlaySocket.subscribe(callback);
  }

  unsubscribe(callback: (data: PlayByPlayResponse) => void): void {
    playByPlaySocket.unsubscribe(callback);
  }

  disconnect(): void {
    playByPlaySocket.disconnect();
  }
}

export default PlayByPlayWebSocketService;
