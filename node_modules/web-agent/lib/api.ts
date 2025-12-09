import { Ticket, TicketFilter, Assignment, PropertySummary, EvidenceRecord } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.rentfix.local';

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || res.statusText);
  }
  return res.json() as Promise<T>;
}

export async function fetchTickets(filter?: TicketFilter): Promise<Ticket[]> {
  const params = new URLSearchParams();
  if (filter?.query) params.set('q', filter.query);
  if (filter?.status && filter.status !== 'all') params.set('status', filter.status);
  if (filter?.urgency && filter.urgency !== 'all') params.set('urgency', filter.urgency);
  if (filter?.property) params.set('property', filter.property);
  const res = await fetch(`${API_BASE}/tickets?${params.toString()}`, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include'
  });
  return handle<Ticket[]>(res);
}

export async function fetchAssignments(): Promise<Assignment[]> {
  const res = await fetch(`${API_BASE}/assignments`, { credentials: 'include' });
  return handle<Assignment[]>(res);
}

export async function fetchProperties(): Promise<PropertySummary[]> {
  const res = await fetch(`${API_BASE}/properties`, { credentials: 'include' });
  return handle<PropertySummary[]>(res);
}

export async function fetchEvidence(ticketId?: string): Promise<EvidenceRecord[]> {
  const url = ticketId ? `${API_BASE}/evidence?ticketId=${ticketId}` : `${API_BASE}/evidence`;
  const res = await fetch(url, { credentials: 'include' });
  return handle<EvidenceRecord[]>(res);
}

export async function authenticate(email: string, password: string) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  return handle<{ token: string }>(res);
}
