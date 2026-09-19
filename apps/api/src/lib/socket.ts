import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

let io: SocketIOServer | null = null;

export function initSocketServer(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    // Client joins match room for live leaderboard updates
    socket.on('join_match', (matchId: string) => {
      if (matchId) {
        socket.join(`match:${matchId}`);
      }
    });

    socket.on('leave_match', (matchId: string) => {
      if (matchId) {
        socket.leave(`match:${matchId}`);
      }
    });
  });

  return io;
}

export function getIo(): SocketIOServer | null {
  return io;
}

export function broadcastLeaderboardUpdate(matchId: string, payload: any): void {
  if (io) {
    io.to(`match:${matchId}`).emit('leaderboard:update', payload);
  }
}
