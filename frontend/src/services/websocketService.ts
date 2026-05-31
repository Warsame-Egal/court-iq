import { ScoreboardResponse } from '../types/scoreboard';
import { ReconnectingWebSocket } from './ReconnectingWebSocket';

const scoreboardSocket = new ReconnectingWebSocket<ScoreboardResponse, string>(
  url => url,
  { logLabel: 'Scoreboard WebSocket' },
);

export default {
  connect: (url: string) => scoreboardSocket.connect(url),
  subscribe: (callback: (data: ScoreboardResponse) => void) => scoreboardSocket.subscribe(callback),
  unsubscribe: (callback: (data: ScoreboardResponse) => void) =>
    scoreboardSocket.unsubscribe(callback),
  disconnect: () => scoreboardSocket.disconnect(),
};
