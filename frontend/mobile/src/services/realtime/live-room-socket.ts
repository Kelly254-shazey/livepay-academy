import { io, type Socket } from 'socket.io-client';

import { getNodeApiOrigin } from '@/api/client';
import type { LiveChatMessageRecord } from '@/shared';

type LiveRoomSocketHandlers = {
  liveId: string;
  accessToken: string;
  roomAccessToken: string;
  onViewerCount?: (count: number) => void;
  onMessage?: (message: LiveChatMessageRecord) => void;
  onError?: (message: string) => void;
  onStateChange?: (state: 'connecting' | 'connected' | 'disconnected' | 'error') => void;
};

let socket: Socket | null = null;
let socketToken: string | null = null;
let activeSubscriptions = 0;

function ensureSocket(accessToken: string) {
  const origin = getNodeApiOrigin();

  if (!origin) {
    throw new Error('Set EXPO_PUBLIC_API_BASE_URL before using live realtime.');
  }

  if (socket && socketToken === accessToken) {
    return socket;
  }

  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
  }

  socketToken = accessToken;
  socket = io(origin, {
    transports: ['websocket'],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    timeout: 10000,
    auth: {
      token: accessToken,
    },
  });

  return socket;
}

export function connectLiveRoomSocket({
  liveId,
  accessToken,
  roomAccessToken,
  onViewerCount,
  onMessage,
  onError,
  onStateChange,
}: LiveRoomSocketHandlers) {
  const liveSocket = ensureSocket(accessToken);
  activeSubscriptions += 1;

  const joinRoom = () => {
    onStateChange?.('connected');
    liveSocket.emit('room:join', {
      liveSessionId: liveId,
      roomAccessToken,
    });
  };

  const handleConnect = () => {
    joinRoom();
  };

  const handleDisconnect = () => {
    onStateChange?.('disconnected');
  };

  const handleConnectError = () => {
    onStateChange?.('error');
    onError?.('Unable to connect to the live room right now.');
  };

  const handleRoomError = (payload: { message?: string }) => {
    onStateChange?.('error');
    onError?.(payload.message ?? 'Live room error.');
  };

  const handleViewerCount = (payload: { liveSessionId?: string; count?: number }) => {
    if (payload.liveSessionId !== liveId || typeof payload.count !== 'number') {
      return;
    }

    onViewerCount?.(payload.count);
  };

  const handleChatMessage = (payload: {
    id: string;
    liveSessionId?: string;
    body: string;
    senderId: string;
    authorName?: string;
    status?: string;
    sentAt: string;
  }) => {
    if (payload.liveSessionId !== liveId) {
      return;
    }

    onMessage?.({
      id: payload.id,
      body: payload.body,
      senderId: payload.senderId,
      authorName: payload.authorName?.trim() || 'Viewer',
      sentAt: payload.sentAt,
      status: payload.status,
    });
  };

  onStateChange?.('connecting');

  liveSocket.on('connect', handleConnect);
  liveSocket.on('disconnect', handleDisconnect);
  liveSocket.on('connect_error', handleConnectError);
  liveSocket.on('room:error', handleRoomError);
  liveSocket.on('room:viewer_count', handleViewerCount);
  liveSocket.on('chat:message', handleChatMessage);

  if (liveSocket.connected) {
    joinRoom();
  }

  return () => {
    liveSocket.off('connect', handleConnect);
    liveSocket.off('disconnect', handleDisconnect);
    liveSocket.off('connect_error', handleConnectError);
    liveSocket.off('room:error', handleRoomError);
    liveSocket.off('room:viewer_count', handleViewerCount);
    liveSocket.off('chat:message', handleChatMessage);

    activeSubscriptions = Math.max(activeSubscriptions - 1, 0);
    if (activeSubscriptions === 0) {
      liveSocket.disconnect();
      socket = null;
      socketToken = null;
    }
  };
}

export function sendLiveRoomChatMessage(liveId: string, body: string) {
  if (!socket?.connected) {
    throw new Error('Live room connection is not ready.');
  }

  socket.emit('chat:message', {
    liveSessionId: liveId,
    body,
  });
}

export function disconnectLiveRoomSocket() {
  activeSubscriptions = 0;

  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
  }

  socket = null;
  socketToken = null;
}
