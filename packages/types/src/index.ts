export type Role = 'tenant' | 'agent' | 'contractor';

export interface User {
  id: string;
  name: string;
  role: Role;
  tenantId?: string;
  contactEmail?: string;
}

export interface Ticket {
  id: string;
  unitId: string;
  tenantId: string;
  issueType: string;
  status: 'new' | 'triaged' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
}
