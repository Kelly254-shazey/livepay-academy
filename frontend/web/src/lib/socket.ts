import { io, type Socket } from 'socket.io-client';
import { env } from './env';

let socket: Socket | null = null;

export function getLiveGateSocket() {
  const target =
    env.socketUrl || (typeof window !== 'undefined' ? window.location.origin : '');

  if (!target) return null;

  if (!socket) {
    socket = io(target, {
      autoConnect: false,
      transports: ['websocket'],
    });
  }

  return socket;
}
