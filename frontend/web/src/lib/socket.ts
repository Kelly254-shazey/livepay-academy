import { io, type Socket } from 'socket.io-client';
import { env } from './env';

let socket: Socket | null = null;

export function getLiveGateSocket() {
  if (!env.socketUrl) return null;

  if (!socket) {
    socket = io(env.socketUrl, {
      autoConnect: false,
      transports: ['websocket'],
    });
  }

  return socket;
}
