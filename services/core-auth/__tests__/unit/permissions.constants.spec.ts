import {
  PERMISSIONS,
  AGENT_ROLES,
  CONTRACTOR_ROLES,
  ROLE_PERMISSIONS,
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  getPermissionsForRole,
  Permission
} from '../../src/constants/permissions';

describe('Permissions Constants', () => {
  describe('PERMISSIONS', () => {
    it('should define wildcard permission', () => {
      expect(PERMISSIONS.ALL).toBe('*');
    });

    it('should define organization permissions', () => {
      expect(PERMISSIONS.ORG_VIEW).toBe('organization:view');
      expect(PERMISSIONS.ORG_UPDATE).toBe('organization:update');
      expect(PERMISSIONS.ORG_DELETE).toBe('organization:delete');
      expect(PERMISSIONS.ORG_BILLING).toBe('organization:billing');
    });

    it('should define property permissions', () => {
      expect(PERMISSIONS.PROPERTY_CREATE).toBe('property:create');
      expect(PERMISSIONS.PROPERTY_VIEW).toBe('property:view');
      expect(PERMISSIONS.PROPERTY_UPDATE).toBe('property:update');
      expect(PERMISSIONS.PROPERTY_DELETE).toBe('property:delete');
    });

    it('should define ticket permissions', () => {
      expect(PERMISSIONS.TICKET_CREATE).toBe('ticket:create');
      expect(PERMISSIONS.TICKET_VIEW).toBe('ticket:view');
      expect(PERMISSIONS.TICKET_VIEW_OWN).toBe('ticket:view_own');
      expect(PERMISSIONS.TICKET_ASSIGN).toBe('ticket:assign');
    });

    it('should define job permissions', () => {
      expect(PERMISSIONS.JOB_VIEW_ASSIGNED).toBe('job:view_assigned');
      expect(PERMISSIONS.JOB_ACCEPT).toBe('job:accept');
      expect(PERMISSIONS.JOB_COMPLETE).toBe('job:complete');
    });

    it('should define user permissions', () => {
      expect(PERMISSIONS.USER_VIEW_SELF).toBe('user:view_self');
      expect(PERMISSIONS.USER_UPDATE_SELF).toBe('user:update_self');
      expect(PERMISSIONS.USER_DELETE_SELF).toBe('user:delete_self');
    });
  });

  describe('AGENT_ROLES', () => {
    it('should define agent sub-roles', () => {
      expect(AGENT_ROLES.OWNER).toBe('OWNER');
      expect(AGENT_ROLES.MANAGER).toBe('MANAGER');
      expect(AGENT_ROLES.SUPPORT).toBe('SUPPORT');
    });
  });

  describe('CONTRACTOR_ROLES', () => {
    it('should define contractor role', () => {
      expect(CONTRACTOR_ROLES.CONTRACTOR).toBe('CONTRACTOR');
    });
  });

  describe('ROLE_PERMISSIONS', () => {
    it('should give OWNER full access', () => {
      expect(ROLE_PERMISSIONS.OWNER).toContain(PERMISSIONS.ALL);
    });

    it('should give MANAGER property management permissions', () => {
      expect(ROLE_PERMISSIONS.MANAGER).toContain(PERMISSIONS.PROPERTY_CREATE);
      expect(ROLE_PERMISSIONS.MANAGER).toContain(PERMISSIONS.PROPERTY_VIEW);
      expect(ROLE_PERMISSIONS.MANAGER).toContain(PERMISSIONS.PROPERTY_UPDATE);
      expect(ROLE_PERMISSIONS.MANAGER).toContain(PERMISSIONS.PROPERTY_DELETE);
    });

    it('should give MANAGER ticket permissions', () => {
      expect(ROLE_PERMISSIONS.MANAGER).toContain(PERMISSIONS.TICKET_CREATE);
      expect(ROLE_PERMISSIONS.MANAGER).toContain(PERMISSIONS.TICKET_VIEW);
      expect(ROLE_PERMISSIONS.MANAGER).toContain(PERMISSIONS.TICKET_ASSIGN);
    });

    it('should NOT give MANAGER billing permissions', () => {
      expect(ROLE_PERMISSIONS.MANAGER).not.toContain(PERMISSIONS.ORG_BILLING);
      expect(ROLE_PERMISSIONS.MANAGER).not.toContain(PERMISSIONS.ORG_DELETE);
    });

    it('should give SUPPORT limited permissions', () => {
      expect(ROLE_PERMISSIONS.SUPPORT).toContain(PERMISSIONS.TICKET_VIEW);
      expect(ROLE_PERMISSIONS.SUPPORT).toContain(PERMISSIONS.TICKET_COMMENT);
      expect(ROLE_PERMISSIONS.SUPPORT).not.toContain(PERMISSIONS.TICKET_ASSIGN);
      expect(ROLE_PERMISSIONS.SUPPORT).not.toContain(PERMISSIONS.PROPERTY_CREATE);
    });

    it('should give CONTRACTOR job-related permissions', () => {
      expect(ROLE_PERMISSIONS.CONTRACTOR).toContain(PERMISSIONS.JOB_VIEW_ASSIGNED);
      expect(ROLE_PERMISSIONS.CONTRACTOR).toContain(PERMISSIONS.JOB_ACCEPT);
      expect(ROLE_PERMISSIONS.CONTRACTOR).toContain(PERMISSIONS.JOB_COMPLETE);
      expect(ROLE_PERMISSIONS.CONTRACTOR).toContain(PERMISSIONS.JOB_SUBMIT_INVOICE);
    });

    it('should give CONTRACTOR self-management permissions', () => {
      expect(ROLE_PERMISSIONS.CONTRACTOR).toContain(PERMISSIONS.USER_VIEW_SELF);
      expect(ROLE_PERMISSIONS.CONTRACTOR).toContain(PERMISSIONS.USER_UPDATE_SELF);
      expect(ROLE_PERMISSIONS.CONTRACTOR).toContain(PERMISSIONS.USER_DELETE_SELF);
    });

    it('should NOT give CONTRACTOR property permissions', () => {
      expect(ROLE_PERMISSIONS.CONTRACTOR).not.toContain(PERMISSIONS.PROPERTY_CREATE);
      expect(ROLE_PERMISSIONS.CONTRACTOR).not.toContain(PERMISSIONS.PROPERTY_VIEW);
    });

    it('should give TENANT basic permissions', () => {
      expect(ROLE_PERMISSIONS.TENANT).toContain(PERMISSIONS.TICKET_CREATE);
      expect(ROLE_PERMISSIONS.TENANT).toContain(PERMISSIONS.TICKET_VIEW_OWN);
      expect(ROLE_PERMISSIONS.TENANT).toContain(PERMISSIONS.USER_VIEW_SELF);
    });

    it('should give ADMIN full access', () => {
      expect(ROLE_PERMISSIONS.ADMIN).toContain(PERMISSIONS.ALL);
    });
  });

  describe('hasPermission', () => {
    it('should return true for exact match', () => {
      const grants: Permission[] = [PERMISSIONS.PROPERTY_VIEW, PERMISSIONS.TICKET_VIEW];
      expect(hasPermission(grants, PERMISSIONS.PROPERTY_VIEW)).toBe(true);
    });

    it('should return false when permission not in grants', () => {
      const grants: Permission[] = [PERMISSIONS.PROPERTY_VIEW];
      expect(hasPermission(grants, PERMISSIONS.PROPERTY_CREATE)).toBe(false);
    });

    it('should return true for any permission when wildcard granted', () => {
      const grants: Permission[] = [PERMISSIONS.ALL];
      expect(hasPermission(grants, PERMISSIONS.PROPERTY_CREATE)).toBe(true);
      expect(hasPermission(grants, PERMISSIONS.ORG_BILLING)).toBe(true);
      expect(hasPermission(grants, PERMISSIONS.PAYMENT_REFUND)).toBe(true);
    });

    it('should return false for empty grants', () => {
      const grants: Permission[] = [];
      expect(hasPermission(grants, PERMISSIONS.PROPERTY_VIEW)).toBe(false);
    });
  });

  describe('hasAllPermissions', () => {
    it('should return true when all permissions granted', () => {
      const grants: Permission[] = [
        PERMISSIONS.PROPERTY_VIEW,
        PERMISSIONS.PROPERTY_CREATE,
        PERMISSIONS.TICKET_VIEW
      ];
      const required: Permission[] = [PERMISSIONS.PROPERTY_VIEW, PERMISSIONS.PROPERTY_CREATE];

      expect(hasAllPermissions(grants, required)).toBe(true);
    });

    it('should return false when any permission missing', () => {
      const grants: Permission[] = [PERMISSIONS.PROPERTY_VIEW];
      const required: Permission[] = [PERMISSIONS.PROPERTY_VIEW, PERMISSIONS.PROPERTY_CREATE];

      expect(hasAllPermissions(grants, required)).toBe(false);
    });

    it('should return true with wildcard for any required permissions', () => {
      const grants: Permission[] = [PERMISSIONS.ALL];
      const required: Permission[] = [
        PERMISSIONS.PROPERTY_VIEW,
        PERMISSIONS.PROPERTY_CREATE,
        PERMISSIONS.ORG_BILLING
      ];

      expect(hasAllPermissions(grants, required)).toBe(true);
    });

    it('should return true for empty required permissions', () => {
      const grants: Permission[] = [];
      expect(hasAllPermissions(grants, [])).toBe(true);
    });
  });

  describe('hasAnyPermission', () => {
    it('should return true when at least one permission granted', () => {
      const grants: Permission[] = [PERMISSIONS.PROPERTY_VIEW];
      const required: Permission[] = [PERMISSIONS.PROPERTY_VIEW, PERMISSIONS.PROPERTY_CREATE];

      expect(hasAnyPermission(grants, required)).toBe(true);
    });

    it('should return false when no permissions match', () => {
      const grants: Permission[] = [PERMISSIONS.TICKET_VIEW];
      const required: Permission[] = [PERMISSIONS.PROPERTY_VIEW, PERMISSIONS.PROPERTY_CREATE];

      expect(hasAnyPermission(grants, required)).toBe(false);
    });

    it('should return true with wildcard', () => {
      const grants: Permission[] = [PERMISSIONS.ALL];
      const required: Permission[] = [PERMISSIONS.PROPERTY_VIEW];

      expect(hasAnyPermission(grants, required)).toBe(true);
    });

    it('should return false for empty required permissions', () => {
      const grants: Permission[] = [PERMISSIONS.PROPERTY_VIEW];
      expect(hasAnyPermission(grants, [])).toBe(false);
    });
  });

  describe('getPermissionsForRole', () => {
    it('should return permissions for OWNER role', () => {
      const permissions = getPermissionsForRole(AGENT_ROLES.OWNER);
      expect(permissions).toContain(PERMISSIONS.ALL);
    });

    it('should return permissions for MANAGER role', () => {
      const permissions = getPermissionsForRole(AGENT_ROLES.MANAGER);
      expect(permissions).toContain(PERMISSIONS.PROPERTY_CREATE);
      expect(permissions.length).toBeGreaterThan(10);
    });

    it('should return permissions for CONTRACTOR role', () => {
      const permissions = getPermissionsForRole(CONTRACTOR_ROLES.CONTRACTOR);
      expect(permissions).toContain(PERMISSIONS.JOB_VIEW_ASSIGNED);
    });

    it('should return empty array for unknown role', () => {
      const permissions = getPermissionsForRole('UNKNOWN_ROLE');
      expect(permissions).toEqual([]);
    });
  });
});
