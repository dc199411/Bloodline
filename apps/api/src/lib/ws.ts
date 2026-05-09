import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';

let io: Server | null = null;

export function setupWebSocket(httpServer: HttpServer): Server {
  if (io) {
    return io;
  }

  io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN ?? '*',
      methods: ['GET', 'POST'],
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  const ALLOWED_ROOM_PREFIXES = ['agent:', 'bounty:', 'deploy:'];

  io.on('connection', (socket) => {
    const wallet = socket.handshake.query.wallet as string | undefined;
    if (wallet && /^0x[a-fA-F0-9]{40}$/.test(wallet)) {
      socket.join(wallet.toLowerCase());
    }

    socket.on('join', (room: string) => {
      if (
        typeof room === 'string' &&
        room.length <= 128 &&
        ALLOWED_ROOM_PREFIXES.some((prefix) => room.startsWith(prefix))
      ) {
        socket.join(room.toLowerCase());
      }
    });

    socket.on('disconnect', () => {});
  });

  return io;
}

export function getIO(): Server | null {
  return io;
}
