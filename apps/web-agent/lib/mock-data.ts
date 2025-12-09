import { Assignment, EvidenceRecord, PropertySummary, Ticket } from './types';

export const tickets: Ticket[] = [
  {
    id: 't-1001',
    title: 'Water leak under kitchen sink',
    description: 'Tenant reported steady leak, warped cabinet base.',
    property: 'Maple Apartments',
    unit: '3B',
    status: 'triaged',
    urgency: 'urgent',
    slaCountdownMinutes: 45,
    aiConfidence: 0.86,
    responsibility: 'landlord',
    photos: ['/images/demo/leak.jpg'],
    contractorRecommendation: 'AquaFix Plumbing - reliability 4.8/5',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 't-1002',
    title: 'Broken window latch',
    description: 'Latch stuck, window will not close.',
    property: 'Cedar Townhomes',
    unit: '12A',
    status: 'assigned',
    urgency: 'routine',
    slaCountdownMinutes: 320,
    aiConfidence: 0.74,
    responsibility: 'tenant',
    photos: ['/images/demo/window.jpg'],
    contractorRecommendation: 'SafeHome Repairs - reliability 4.6/5',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const assignments: Assignment[] = [
  {
    id: 'a-3001',
    ticketId: 't-1001',
    contractor: 'AquaFix Plumbing',
    status: 'assigned',
    reliabilityScore: 4.8,
    scheduledAt: new Date(Date.now() + 60 * 60 * 1000).toISOString()
  },
  {
    id: 'a-3002',
    ticketId: 't-1002',
    contractor: 'SafeHome Repairs',
    status: 'scheduled',
    reliabilityScore: 4.6,
    scheduledAt: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString()
  }
];

export const properties: PropertySummary[] = [
  {
    id: 'p-1',
    name: 'Maple Apartments',
    address: '123 Maple Street',
    openTickets: 4,
    occupancy: 'occupied',
    healthScore: 92
  },
  {
    id: 'p-2',
    name: 'Cedar Townhomes',
    address: '41 Cedar Lane',
    openTickets: 2,
    occupancy: 'occupied',
    healthScore: 87
  },
  {
    id: 'p-3',
    name: 'Harbor Residences',
    address: '88 Bay Ave',
    openTickets: 1,
    occupancy: 'vacant',
    healthScore: 80
  }
];

export const evidences: EvidenceRecord[] = [
  {
    id: 'ev-1',
    ticketId: 't-1001',
    fileUrl: '/images/demo/leak.jpg',
    type: 'photo',
    capturedBy: 'Tenant',
    capturedAt: new Date().toISOString(),
    hash: 'abc123'
  },
  {
    id: 'ev-2',
    ticketId: 't-1002',
    fileUrl: '/images/demo/window.jpg',
    type: 'photo',
    capturedBy: 'Tenant',
    capturedAt: new Date().toISOString(),
    hash: 'def456'
  }
];
