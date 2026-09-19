import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    // In dev, Vite proxies /api to port 4000, or socket can connect directly to port 4000
    const SOCKET_URL = window.location.hostname === 'localhost' ? 'http://localhost:4000' : window.location.origin;
    socket = io(SOCKET_URL, {
      autoConnect: true,
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      console.log('⚡ Connected to PitchXI live WebSocket server:', socket?.id);
    });

    socket.on('disconnect', () => {
      console.log('⚡ Disconnected from PitchXI live WebSocket server');
    });
  }

  return socket;
}

export function subscribeToMatch(matchId: string): void {
  const s = getSocket();
  s.emit('join_match', matchId);
}

export function unsubscribeFromMatch(matchId: string): void {
  const s = getSocket();
  s.emit('leave_match', matchId);
}
