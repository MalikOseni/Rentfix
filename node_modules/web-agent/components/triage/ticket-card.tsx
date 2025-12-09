'use client';

import { Clock } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Ticket } from '../../lib/types';

interface TicketCardProps {
  ticket: Ticket;
  onSelect?: (ticket: Ticket) => void;
  isActive?: boolean;
}

export function TicketCard({ ticket, onSelect, isActive }: TicketCardProps) {
  const urgencyVariant = ticket.urgency === 'emergency' ? 'danger' : ticket.urgency === 'urgent' ? 'warning' : 'muted';
  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => onSelect?.(ticket)}
      onKeyDown={(e) => e.key === 'Enter' && onSelect?.(ticket)}
      className={`cursor-pointer border ${isActive ? 'border-[var(--color-primary)]' : 'border-[var(--color-border)]'}`}
      aria-pressed={isActive}
    >
      <CardHeader className="items-start gap-2">
        <div>
          <Badge variant={urgencyVariant}>{ticket.urgency.toUpperCase()}</Badge>
          <CardTitle className="mt-1 text-base">{ticket.title}</CardTitle>
          <p className="text-sm text-[var(--color-muted)]">{ticket.property}</p>
        </div>
        {ticket.slaCountdownMinutes && (
          <span className="status-chip" data-variant={ticket.slaCountdownMinutes < 60 ? 'warning' : 'info'}>
            <Clock size={14} />
            {ticket.slaCountdownMinutes}m
          </span>
        )}
      </CardHeader>
      <CardContent>
        <p
          className="text-sm leading-relaxed text-[var(--color-text)]"
          style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
        >
          {ticket.description}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[var(--color-muted)]">
          <span className="status-chip" data-variant="info">
            Status: {ticket.status}
          </span>
          {ticket.aiConfidence && (
            <span className="status-chip" data-variant="success">
              AI confidence {Math.round(ticket.aiConfidence * 100)}%
            </span>
          )}
          {ticket.responsibility && (
            <span className="status-chip" data-variant="muted">Resp. {ticket.responsibility}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
