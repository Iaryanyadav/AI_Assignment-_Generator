'use client';
import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAssignmentStore, GeneratedPaper } from '@/store/assignmentStore';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4000';

let socket: Socket | null = null;

export function useWebSocket() {
  const socketRef = useRef<Socket | null>(null);
  const { updateGenerationStatus, setGeneratedPaper } = useAssignmentStore();

  useEffect(() => {
    if (!socketRef.current) {
      socket = io(WS_URL, { transports: ['websocket', 'polling'] });
      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('[WS] Connected:', socket?.id);
      });

      socket.on('disconnect', () => {
        console.log('[WS] Disconnected');
      });

      socket.on('status', (data: {
        assignmentId: string;
        status: string;
        message: string;
        progress: number;
        generatedPaper?: GeneratedPaper;
      }) => {
        updateGenerationStatus({
          status: data.status as 'idle' | 'pending' | 'processing' | 'completed' | 'failed',
          message: data.message,
          progress: data.progress,
        });

        if (data.status === 'completed' && data.generatedPaper) {
          setGeneratedPaper(data.generatedPaper);
        }
      });
    }

    return () => {
      // Don't disconnect on component unmount, keep persistent connection
    };
  }, [updateGenerationStatus, setGeneratedPaper]);

  const subscribe = (assignmentId: string) => {
    socketRef.current?.emit('subscribe', assignmentId);
  };

  const unsubscribe = (assignmentId: string) => {
    socketRef.current?.emit('unsubscribe', assignmentId);
  };

  return { subscribe, unsubscribe };
}
