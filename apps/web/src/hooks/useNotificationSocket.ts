'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/auth.store';

/**
 * Connects to the /notifications Socket.io namespace and tracks
 * unread notification count. Emits `notification:new` events.
 */
export function useNotificationSocket() {
  const { user } = useAuthStore();
  const socketRef = useRef<Socket | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const socket = io(
      `${process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:3001'}/notifications`,
      { withCredentials: true, transports: ['websocket'] }
    );
    socketRef.current = socket;

    socket.on('notification:new', () => {
      setUnreadCount((c) => c + 1);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user?.id]);

  function clearUnread() {
    setUnreadCount(0);
  }

  return { unreadCount, clearUnread };
}
