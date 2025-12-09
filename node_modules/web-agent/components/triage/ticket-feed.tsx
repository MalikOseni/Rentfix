'use client';

import { useMemo, useState } from 'react';
import { TicketFilter, Ticket } from '../../lib/types';
import { TicketCard } from './ticket-card';
import { useTicketFeed } from '../../lib/realtime';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Select, SelectItem } from '../ui/select';
import { Input } from '../ui/input';

interface TicketFeedProps {
  initialTickets: Ticket[];
}

export function TicketFeed({ initialTickets }: TicketFeedProps) {
  const [filter, setFilter] = useState<TicketFilter>({ status: 'all', urgency: 'all' });
  const [active, setActive] = useState<Ticket | undefined>(initialTickets[0]);
  const tickets = useTicketFeed(initialTickets);

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      if (filter.status && filter.status !== 'all' && ticket.status !== filter.status) return false;
      if (filter.urgency && filter.urgency !== 'all' && ticket.urgency !== filter.urgency) return false;
      if (filter.query && !ticket.title.toLowerCase().includes(filter.query.toLowerCase())) return false;
      if (filter.property && ticket.property !== filter.property) return false;
      return true;
    });
  }, [filter, tickets]);

  return (
    <div className="grid gap-4 lg:grid-cols-[1.1fr_1.3fr]">
      <div className="space-y-3">
        <Card>
          <CardHeader className="items-center justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <CardTitle>Live ticket feed</CardTitle>
              <p className="text-sm text-[var(--color-muted)]">Powered by WebSockets with offline-safe reconnection.</p>
            </div>
            <Button variant="secondary" onClick={() => setFilter({ status: 'all', urgency: 'all' })}>
              Clear filters
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <Input
                aria-label="Search tickets"
                placeholder="Search"
                onChange={(e) => setFilter((prev) => ({ ...prev, query: e.target.value }))}
              />
              <Select
                placeholder="Status"
                value={filter.status ?? 'all'}
                onValueChange={(value) => setFilter((prev) => ({ ...prev, status: value as TicketFilter['status'] }))}
              >
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="triaged">Triaged</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="in_progress">In progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </Select>
              <Select
                placeholder="Urgency"
                value={filter.urgency ?? 'all'}
                onValueChange={(value) => setFilter((prev) => ({ ...prev, urgency: value as TicketFilter['urgency'] }))}
              >
                <SelectItem value="all">All urgency</SelectItem>
                <SelectItem value="emergency">Emergency</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="routine">Routine</SelectItem>
              </Select>
            </div>
            <div className="space-y-3">
              {filteredTickets.map((ticket) => (
                <TicketCard key={ticket.id} ticket={ticket} onSelect={setActive} isActive={active?.id === ticket.id} />
              ))}
              {filteredTickets.length === 0 && <p className="text-sm text-[var(--color-muted)]">No tickets match filters.</p>}
            </div>
          </CardContent>
        </Card>
      </div>
      <TicketCardListDetail ticket={active} />
    </div>
  );
}

function TicketCardListDetail({ ticket }: { ticket?: Ticket }) {
  const { TicketDetail } = require('./ticket-detail');
  return <TicketDetail ticket={ticket} />;
}
