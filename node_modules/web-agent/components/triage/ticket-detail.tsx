'use client';

import { AlertTriangle, CheckCircle2, MessageSquare, PhoneCall, Sparkles } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Ticket } from '../../lib/types';

interface TicketDetailProps {
  ticket?: Ticket;
}

export function TicketDetail({ ticket }: TicketDetailProps) {
  if (!ticket) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No ticket selected</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-[var(--color-muted)]">
          Choose a ticket from the left to review AI recommendations and assign contractors.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex items-start justify-between">
        <div>
          <Badge>{ticket.urgency.toUpperCase()}</Badge>
          <CardTitle className="mt-2 text-xl">{ticket.title}</CardTitle>
          <p className="text-sm text-[var(--color-muted)]">{ticket.property}</p>
        </div>
        <div className="flex flex-col items-end gap-2 text-right text-xs text-[var(--color-muted)]">
          <span className="status-chip" data-variant={ticket.status === 'completed' ? 'success' : 'info'}>
            {ticket.status}
          </span>
          {ticket.aiConfidence && (
            <span className="status-chip" data-variant="success">
              AI confidence {Math.round(ticket.aiConfidence * 100)}%
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-sm text-[var(--color-text)]">{ticket.description}</p>
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-[var(--color-muted)]">
            {ticket.responsibility && <Badge variant="muted">Responsibility: {ticket.responsibility}</Badge>}
            {ticket.contractorRecommendation && <Badge variant="success">{ticket.contractorRecommendation}</Badge>}
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles size={16} />
              AI recommendation
            </div>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              Confidence-weighted responsibility and urgency suggestions. Override if onsite intel differs.
            </p>
          </div>
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <AlertTriangle size={16} />
              SLA
            </div>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              Resolve before {ticket.slaCountdownMinutes ?? 0} minutes to stay inside compliance.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button>Assign contractor</Button>
          <Button variant="secondary">Override responsibility</Button>
          <Button variant="ghost">Request more info</Button>
          <Button variant="ghost" aria-label="Call tenant">
            <PhoneCall size={16} className="mr-1" />
            Call tenant
          </Button>
          <Button variant="ghost" aria-label="Message">
            <MessageSquare size={16} className="mr-1" />
            Message thread
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
