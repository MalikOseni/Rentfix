/**
 * Fine-grained RBAC Permissions for RentalFix
 *
 * Permission format: resource:action
 *
 * Agent Sub-Roles:
 * - OWNER: Full access to organization resources (*)
 * - MANAGER: Manage properties, tenants, tickets - no billing/org settings
 * - SUPPORT: View and respond to tickets only
 *
 * Contractor Roles:
 * - CONTRACTOR: Self-manage profile, accept/complete assigned jobs
 */

// Permission action constants
export const PERMISSIONS = {
  // Wildcard - full access
  ALL: '*',

  // Organization management
  ORG_VIEW: 'organization:view',
  ORG_UPDATE: 'organization:update',
  ORG_DELETE: 'organization:delete',
  ORG_BILLING: 'organization:billing',
  ORG_INVITE_MEMBER: 'organization:invite_member',
  ORG_REMOVE_MEMBER: 'organization:remove_member',

  // Property management
  PROPERTY_CREATE: 'property:create',
  PROPERTY_VIEW: 'property:view',
  PROPERTY_UPDATE: 'property:update',
  PROPERTY_DELETE: 'property:delete',
  PROPERTY_ASSIGN_TENANT: 'property:assign_tenant',

  // Tenant management
  TENANT_VIEW: 'tenant:view',
  TENANT_INVITE: 'tenant:invite',
  TENANT_REMOVE: 'tenant:remove',
  TENANT_UPDATE: 'tenant:update',

  // Ticket management
  TICKET_CREATE: 'ticket:create',
  TICKET_VIEW: 'ticket:view',
  TICKET_VIEW_OWN: 'ticket:view_own',
  TICKET_UPDATE: 'ticket:update',
  TICKET_ASSIGN: 'ticket:assign',
  TICKET_CLOSE: 'ticket:close',
  TICKET_COMMENT: 'ticket:comment',

  // Contractor management
  CONTRACTOR_VIEW: 'contractor:view',
  CONTRACTOR_ASSIGN: 'contractor:assign',
  CONTRACTOR_RATE: 'contractor:rate',
  CONTRACTOR_BLOCK: 'contractor:block',

  // Job management (for contractors)
  JOB_VIEW_ASSIGNED: 'job:view_assigned',
  JOB_ACCEPT: 'job:accept',
  JOB_DECLINE: 'job:decline',
  JOB_COMPLETE: 'job:complete',
  JOB_SUBMIT_INVOICE: 'job:submit_invoice',

  // Analytics
  ANALYTICS_VIEW: 'analytics:view',
  ANALYTICS_EXPORT: 'analytics:export',

  // User management
  USER_VIEW_SELF: 'user:view_self',
  USER_UPDATE_SELF: 'user:update_self',
  USER_DELETE_SELF: 'user:delete_self',

  // Payments
  PAYMENT_VIEW: 'payment:view',
  PAYMENT_CREATE: 'payment:create',
  PAYMENT_REFUND: 'payment:refund'
} as const;

export type PermissionKey = keyof typeof PERMISSIONS;
export type Permission = (typeof PERMISSIONS)[PermissionKey];

// Agent sub-role definitions
export const AGENT_ROLES = {
  OWNER: 'OWNER',
  MANAGER: 'MANAGER',
  SUPPORT: 'SUPPORT'
} as const;

export type AgentRole = (typeof AGENT_ROLES)[keyof typeof AGENT_ROLES];

// Contractor role
export const CONTRACTOR_ROLES = {
  CONTRACTOR: 'CONTRACTOR'
} as const;

export type ContractorRole = (typeof CONTRACTOR_ROLES)[keyof typeof CONTRACTOR_ROLES];

// Permission grants per role
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  // Agent OWNER - full organization access
  [AGENT_ROLES.OWNER]: [PERMISSIONS.ALL],

  // Agent MANAGER - manage properties, tenants, tickets
  [AGENT_ROLES.MANAGER]: [
    PERMISSIONS.ORG_VIEW,
    PERMISSIONS.PROPERTY_CREATE,
    PERMISSIONS.PROPERTY_VIEW,
    PERMISSIONS.PROPERTY_UPDATE,
    PERMISSIONS.PROPERTY_DELETE,
    PERMISSIONS.PROPERTY_ASSIGN_TENANT,
    PERMISSIONS.TENANT_VIEW,
    PERMISSIONS.TENANT_INVITE,
    PERMISSIONS.TENANT_REMOVE,
    PERMISSIONS.TENANT_UPDATE,
    PERMISSIONS.TICKET_CREATE,
    PERMISSIONS.TICKET_VIEW,
    PERMISSIONS.TICKET_UPDATE,
    PERMISSIONS.TICKET_ASSIGN,
    PERMISSIONS.TICKET_CLOSE,
    PERMISSIONS.TICKET_COMMENT,
    PERMISSIONS.CONTRACTOR_VIEW,
    PERMISSIONS.CONTRACTOR_ASSIGN,
    PERMISSIONS.CONTRACTOR_RATE,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.USER_VIEW_SELF,
    PERMISSIONS.USER_UPDATE_SELF
  ],

  // Agent SUPPORT - view and respond to tickets
  [AGENT_ROLES.SUPPORT]: [
    PERMISSIONS.ORG_VIEW,
    PERMISSIONS.PROPERTY_VIEW,
    PERMISSIONS.TENANT_VIEW,
    PERMISSIONS.TICKET_VIEW,
    PERMISSIONS.TICKET_COMMENT,
    PERMISSIONS.CONTRACTOR_VIEW,
    PERMISSIONS.USER_VIEW_SELF,
    PERMISSIONS.USER_UPDATE_SELF
  ],

  // Contractor - manage own profile and jobs
  [CONTRACTOR_ROLES.CONTRACTOR]: [
    PERMISSIONS.USER_VIEW_SELF,
    PERMISSIONS.USER_UPDATE_SELF,
    PERMISSIONS.USER_DELETE_SELF,
    PERMISSIONS.JOB_VIEW_ASSIGNED,
    PERMISSIONS.JOB_ACCEPT,
    PERMISSIONS.JOB_DECLINE,
    PERMISSIONS.JOB_COMPLETE,
    PERMISSIONS.JOB_SUBMIT_INVOICE,
    PERMISSIONS.TICKET_VIEW_OWN,
    PERMISSIONS.TICKET_COMMENT
  ],

  // Tenant - basic self-service
  TENANT: [
    PERMISSIONS.USER_VIEW_SELF,
    PERMISSIONS.USER_UPDATE_SELF,
    PERMISSIONS.USER_DELETE_SELF,
    PERMISSIONS.TICKET_CREATE,
    PERMISSIONS.TICKET_VIEW_OWN,
    PERMISSIONS.TICKET_COMMENT
  ],

  // Admin - system-wide access
  ADMIN: [PERMISSIONS.ALL]
};

/**
 * Check if a permission list includes the required permission
 * Supports wildcard (*) matching
 */
export function hasPermission(grants: Permission[], required: Permission): boolean {
  if (grants.includes(PERMISSIONS.ALL)) {
    return true;
  }
  return grants.includes(required);
}

/**
 * Check if a permission list includes ALL required permissions
 */
export function hasAllPermissions(grants: Permission[], required: Permission[]): boolean {
  return required.every((perm) => hasPermission(grants, perm));
}

/**
 * Check if a permission list includes ANY of the required permissions
 */
export function hasAnyPermission(grants: Permission[], required: Permission[]): boolean {
  return required.some((perm) => hasPermission(grants, perm));
}

/**
 * Get permissions for a role name
 */
export function getPermissionsForRole(roleName: string): Permission[] {
  return ROLE_PERMISSIONS[roleName] || [];
}
