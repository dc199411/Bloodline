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

  io.on('connection', (socket) => {
    console.log('[WS] Client connected:', socket.id);
    socket.on('disconnect', (reason) => {
      console.log('[WS] Client disconnected:', socket.id, reason);
    });
  });

  return io;
}

export function getIO(): Server | null {
  return io;
}
