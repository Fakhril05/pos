'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

export interface SocketTransaction {
  id: string;
  invoiceNo: string;
  merchantName: string;
  customerName: string;
  amount: number;
  paymentMethod: string;
  paymentChannel: string;
  status: string;
  createdAt: string;
}

interface UseTransactionSocketOptions {
  onTransaction?: (tx: SocketTransaction) => void;
}

interface UseTransactionSocketReturn {
  connected: boolean;
}

export function useTransactionSocket(
  options: UseTransactionSocketOptions = {}
): UseTransactionSocketReturn {
  const { onTransaction } = options;
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const callbackRef = useRef(onTransaction);

  // Keep the callback ref up-to-date without triggering reconnect
  useEffect(() => {
    callbackRef.current = onTransaction;
  }, [onTransaction]);

  useEffect(() => {
    const socket = io('/?XTransformPort=3004', {
      transports: ['websocket', 'polling'],
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000,
      timeout: 10000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('new-transaction', (tx: SocketTransaction) => {
      callbackRef.current?.(tx);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  return { connected };
}
