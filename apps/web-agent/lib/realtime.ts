'use client';

import { io, Socket } from 'socket.io-client';
import { useEffect, useMemo, useState } from 'react';
import { Ticket } from './types';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'wss://ws.rentfix.local';

let socket: Socket | null = null;

function getSocket(): Socket {
  if (!socket) {
    socket = io(WS_URL, {
      transports: ['websocket'],
      withCredentials: true,
      reconnectionAttempts: 5
    });
  }
  return socket;
}

export function useTicketFeed(initialTickets: Ticket[]) {
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
  const memoSocket = useMemo(() => getSocket(), []);

  useEffect(() => {
    memoSocket.on('connect_error', (err) => console.warn('WS error', err.message));
    memoSocket.on('ticket.updated', (payload: Ticket) => {
      setTickets((prev) => {
        const existing = prev.find((t) => t.id === payload.id);
        if (existing) {
          return prev.map((t) => (t.id === payload.id ? { ...t, ...payload } : t));
        }
        return [payload, ...prev];
      });
    });
    memoSocket.on('ticket.created', (payload: Ticket) => {
      setTickets((prev) => [payload, ...prev]);
    });
    memoSocket.on('ticket.removed', (ticketId: string) => {
      setTickets((prev) => prev.filter((t) => t.id !== ticketId));
    });
    return () => {
      memoSocket.off('ticket.updated');
      memoSocket.off('ticket.created');
      memoSocket.off('ticket.removed');
    };
  }, [memoSocket]);

  return tickets;
}
