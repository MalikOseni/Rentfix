'use client';

import { useState } from 'react';
import { evidences, tickets } from '../../../lib/mock-data';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { exportEvidenceToPdf } from '../../../lib/pdf';
import { Select, SelectItem } from '../../../components/ui/select';

export default function EvidencePage() {
  const [ticketId, setTicketId] = useState<string>('all');
  const filtered = ticketId === 'all' ? evidences : evidences.filter((ev) => ev.ticketId === ticketId);

  return (
    <section className="dashboard-grid">
      <Card>
        <CardHeader className="items-center justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <CardTitle>Evidence</CardTitle>
            <p className="text-sm text-[var(--color-muted)]">Export PDFs for disputes and SLA audits.</p>
          </div>
          <div className="flex items-center gap-2">
            <Select placeholder="Ticket" value={ticketId} onValueChange={setTicketId}>
              <SelectItem value="all">All tickets</SelectItem>
              {tickets.map((ticket) => (
                <SelectItem key={ticket.id} value={ticket.id}>
                  {ticket.title}
                </SelectItem>
              ))}
            </Select>
            <Button
              variant="secondary"
              onClick={() => exportEvidenceToPdf(filtered, ticketId === 'all' ? 'all' : ticketId)}
              disabled={filtered.length === 0}
            >
              Export PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent className="table-responsive">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="text-left text-[var(--color-muted)]">
                <th className="p-2">Ticket</th>
                <th className="p-2">Type</th>
                <th className="p-2">Captured by</th>
                <th className="p-2">Captured at</th>
                <th className="p-2">Hash</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} className="border-t border-[var(--color-border)]">
                  <td className="p-2">{item.ticketId}</td>
                  <td className="p-2 capitalize">{item.type}</td>
                  <td className="p-2">{item.capturedBy}</td>
                  <td className="p-2">{new Date(item.capturedAt).toLocaleString()}</td>
                  <td className="p-2 font-mono text-xs">{item.hash}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-3 text-[var(--color-muted)]">
                    No evidence for this ticket.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </section>
  );
}
