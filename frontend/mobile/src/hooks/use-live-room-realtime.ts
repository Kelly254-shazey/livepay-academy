import { useEffect, useMemo, useState } from 'react';

import { mobileApi } from '@/api/client';
import {
  connectLiveRoomSocket,
  sendLiveRoomChatMessage,
} from '@/services/realtime/live-room-socket';
import type { LiveChatMessageRecord } from '@/shared';
import { useSessionStore } from '@/store/session-store';

function mergeMessages(
  currentMessages: LiveChatMessageRecord[],
  incomingMessage: LiveChatMessageRecord,
) {
  const nextMessages = [...currentMessages.filter((item) => item.id !== incomingMessage.id), incomingMessage];
  return nextMessages
    .sort((left, right) => Date.parse(left.sentAt) - Date.parse(right.sentAt))
    .slice(-50);
}

export function useLiveRoomRealtime({
  liveId,
  enabled,
  roomAccessToken,
  initialViewerCount,
}: {
  liveId?: string;
  enabled: boolean;
  roomAccessToken?: string;
  initialViewerCount: number;
}) {
  const accessToken = useSessionStore((state) => state.session?.tokens.accessToken);
  const [viewerCount, setViewerCount] = useState(initialViewerCount);
  const [messages, setMessages] = useState<LiveChatMessageRecord[]>([]);
  const [connectionState, setConnectionState] = useState<
    'idle' | 'connecting' | 'connected' | 'disconnected' | 'error'
  >('idle');
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    setViewerCount(initialViewerCount);
  }, [initialViewerCount]);

  useEffect(() => {
    if (!enabled || !liveId) {
      setMessages([]);
      setConnectionState('idle');
      setConnectionError(null);
      return;
    }

    let active = true;
    void mobileApi
      .getLiveChatMessages(liveId, 40)
      .then((nextMessages) => {
        if (active) {
          setMessages(nextMessages.sort((left, right) => Date.parse(left.sentAt) - Date.parse(right.sentAt)));
        }
      })
      .catch((error) => {
        if (active) {
          setConnectionError(error instanceof Error ? error.message : 'Unable to load live chat history.');
        }
      });

    return () => {
      active = false;
    };
  }, [enabled, liveId]);

  useEffect(() => {
    if (!enabled || !liveId || !roomAccessToken || !accessToken) {
      return;
    }

    const joinedAt = Date.now();
    const disconnect = connectLiveRoomSocket({
      liveId,
      accessToken,
      roomAccessToken,
      onViewerCount: setViewerCount,
      onMessage: (message) => setMessages((current) => mergeMessages(current, message)),
      onError: setConnectionError,
      onStateChange: setConnectionState,
    });

    return () => {
      const attendanceSeconds = Math.max(Math.round((Date.now() - joinedAt) / 1000), 0);
      void mobileApi.recordLiveAttendance(liveId, attendanceSeconds).catch(() => undefined);
      disconnect();
    };
  }, [accessToken, enabled, liveId, roomAccessToken]);

  const sendMessage = useMemo(
    () => (body: string) => {
      if (!liveId || !body.trim()) {
        return;
      }

      sendLiveRoomChatMessage(liveId, body.trim());
    },
    [liveId],
  );

  return {
    viewerCount,
    messages,
    sendMessage,
    connectionState,
    connectionError,
  };
}
