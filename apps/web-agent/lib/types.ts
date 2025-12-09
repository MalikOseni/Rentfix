export type TicketStatus = 'new' | 'triaged' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
export type Urgency = 'emergency' | 'urgent' | 'routine';

export interface Ticket {
  id: string;
  title: string;
  description: string;
  property: string;
  unit?: string;
  status: TicketStatus;
  urgency: Urgency;
  slaCountdownMinutes?: number;
  aiConfidence?: number;
  responsibility?: 'landlord' | 'tenant';
  photos?: string[];
  createdAt: string;
  updatedAt: string;
  contractorRecommendation?: string;
}

export interface Assignment {
  id: string;
  ticketId: string;
  contractor: string;
  scheduledAt?: string;
  status: 'assigned' | 'scheduled' | 'completed' | 'declined';
  reliabilityScore?: number;
}

export interface PropertySummary {
  id: string;
  name: string;
  address: string;
  openTickets: number;
  occupancy: 'occupied' | 'vacant';
  healthScore?: number;
}

export interface EvidenceRecord {
  id: string;
  ticketId: string;
  fileUrl: string;
  type: 'photo' | 'video';
  capturedBy: string;
  capturedAt: string;
  hash: string;
}

export interface TicketFilter {
  query?: string;
  status?: TicketStatus | 'all';
  urgency?: Urgency | 'all';
  property?: string;
}
