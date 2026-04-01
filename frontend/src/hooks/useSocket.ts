// src/hooks/useSocket.ts
import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL =
  import.meta.env.MODE !== 'development'
    ? 'https://inkboard.xyz'
    : 'http://localhost:5001';

export function useSocket(boardId: string | undefined) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!boardId) return;

    const socket = io(SOCKET_URL, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('🟢 Socket connected:', socket.id);
      socket.emit('join_board', boardId);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [boardId]);

  return socketRef;
}