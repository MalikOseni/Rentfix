import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ForbiddenException } from '@nestjs/common';
import { PermissionsService } from '../../src/services/permissions.service';
import { Role } from '../../src/entities/role.entity';
import { User, UserRole } from '../../src/entities/user.entity';
import { PERMISSIONS, AGENT_ROLES, ROLE_PERMISSIONS } from '../../src/constants/permissions';

describe('PermissionsService', () => {
  let service: PermissionsService;
  let roleRepository: jest.Mocked<Repository<Role>>;
  let userRepository: jest.Mocked<Repository<User>>;

  beforeEach(async () => {
    const mockRepository = () => ({
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      create: jest.fn((data: any) => data),
      update: jest.fn()
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionsService,
        { provide: getRepositoryToken(Role), useFactory: mockRepository },
        { provide: getRepositoryToken(User), useFactory: mockRepository }
      ]
    }).compile();

    service = module.get<PermissionsService>(PermissionsService);
    roleRepository = module.get(getRepositoryToken(Role));
    userRepository = module.get(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserPermissions', () => {
    it('should return wildcard permission for admin users', async () => {
      const mockUser = { id: 'admin-123', role: UserRole.admin, deletedAt: null } as User;
      userRepository.findOne.mockResolvedValue(mockUser);

      const permissions = await service.getUserPermissions('admin-123', 'org-123');

      expect(permissions).toContain(PERMISSIONS.ALL);
    });

    it('should aggregate permissions from multiple roles', async () => {
      const mockUser = { id: 'user-123', role: UserRole.agent, deletedAt: null } as User;
      const mockRoles = [
        {
          name: AGENT_ROLES.MANAGER,
          permissionGrants: [PERMISSIONS.PROPERTY_CREATE, PERMISSIONS.PROPERTY_VIEW]
        },
        {
          name: 'CUSTOM_ROLE',
          permissionGrants: [PERMISSIONS.ANALYTICS_EXPORT]
        }
      ] as Role[];

      userRepository.findOne.mockResolvedValue(mockUser);
      roleRepository.find.mockResolvedValue(mockRoles);

      const permissions = await service.getUserPermissions('user-123', 'org-123');

      expect(permissions).toContain(PERMISSIONS.PROPERTY_CREATE);
      expect(permissions).toContain(PERMISSIONS.PROPERTY_VIEW);
      expect(permissions).toContain(PERMISSIONS.ANALYTICS_EXPORT);
    });

    it('should return default permissions for users without explicit roles', async () => {
      const mockUser = { id: 'tenant-123', role: UserRole.tenant, deletedAt: null } as User;
      userRepository.findOne.mockResolvedValue(mockUser);
      roleRepository.find.mockResolvedValue([]);

      const permissions = await service.getUserPermissions('tenant-123', 'org-123');

      expect(permissions).toContain(PERMISSIONS.USER_VIEW_SELF);
      expect(permissions).toContain(PERMISSIONS.TICKET_CREATE);
    });

    it('should return empty array for unknown users', async () => {
      userRepository.findOne.mockResolvedValue(null);

      const permissions = await service.getUserPermissions('unknown', 'org-123');

      expect(permissions).toEqual([]);
    });

    it('should include default role permissions plus custom grants', async () => {
      const mockUser = { id: 'user-123', role: UserRole.agent, deletedAt: null } as User;
      const mockRole = {
        name: AGENT_ROLES.OWNER,
        permissionGrants: ['*']
      } as unknown as Role;

      userRepository.findOne.mockResolvedValue(mockUser);
      roleRepository.find.mockResolvedValue([mockRole]);

      const permissions = await service.getUserPermissions('user-123', 'org-123');

      expect(permissions).toContain(PERMISSIONS.ALL);
    });
  });

  describe('checkPermission', () => {
    it('should return true when user has the permission', async () => {
      const mockUser = { id: 'user-123', role: UserRole.agent, deletedAt: null } as User;
      const mockRole = { name: AGENT_ROLES.OWNER, permissionGrants: ['*'] } as unknown as Role;

      userRepository.findOne.mockResolvedValue(mockUser);
      roleRepository.find.mockResolvedValue([mockRole]);

      const result = await service.checkPermission('user-123', 'org-123', PERMISSIONS.PROPERTY_CREATE);

      expect(result).toBe(true);
    });

    it('should return false when user lacks the permission', async () => {
      const mockUser = { id: 'user-123', role: UserRole.tenant, deletedAt: null } as User;
      userRepository.findOne.mockResolvedValue(mockUser);
      roleRepository.find.mockResolvedValue([]);

      const result = await service.checkPermission('user-123', 'org-123', PERMISSIONS.PROPERTY_CREATE);

      expect(result).toBe(false);
    });

    it('should return true for wildcard permission', async () => {
      const mockUser = { id: 'admin-123', role: UserRole.admin, deletedAt: null } as User;
      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.checkPermission('admin-123', 'org-123', PERMISSIONS.PAYMENT_REFUND);

      expect(result).toBe(true);
    });
  });

  describe('checkAllPermissions', () => {
    it('should return true when user has all permissions', async () => {
      const mockUser = { id: 'admin-123', role: UserRole.admin, deletedAt: null } as User;
      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.checkAllPermissions('admin-123', 'org-123', [
        PERMISSIONS.PROPERTY_CREATE,
        PERMISSIONS.PROPERTY_DELETE,
        PERMISSIONS.TENANT_INVITE
      ]);

      expect(result).toBe(true);
    });

    it('should return false when user lacks any permission', async () => {
      const mockUser = { id: 'user-123', role: UserRole.tenant, deletedAt: null } as User;
      userRepository.findOne.mockResolvedValue(mockUser);
      roleRepository.find.mockResolvedValue([]);

      const result = await service.checkAllPermissions('user-123', 'org-123', [
        PERMISSIONS.USER_VIEW_SELF,
        PERMISSIONS.PROPERTY_CREATE
      ]);

      expect(result).toBe(false);
    });
  });

  describe('checkAnyPermission', () => {
    it('should return true when user has any of the permissions', async () => {
      const mockUser = { id: 'tenant-123', role: UserRole.tenant, deletedAt: null } as User;
      userRepository.findOne.mockResolvedValue(mockUser);
      roleRepository.find.mockResolvedValue([]);

      const result = await service.checkAnyPermission('tenant-123', 'org-123', [
        PERMISSIONS.PROPERTY_CREATE,
        PERMISSIONS.USER_VIEW_SELF
      ]);

      expect(result).toBe(true);
    });

    it('should return false when user has none of the permissions', async () => {
      const mockUser = { id: 'tenant-123', role: UserRole.tenant, deletedAt: null } as User;
      userRepository.findOne.mockResolvedValue(mockUser);
      roleRepository.find.mockResolvedValue([]);

      const result = await service.checkAnyPermission('tenant-123', 'org-123', [
        PERMISSIONS.PROPERTY_CREATE,
        PERMISSIONS.ORG_BILLING
      ]);

      expect(result).toBe(false);
    });
  });

  describe('enforcePermission', () => {
    it('should not throw when user has permission', async () => {
      const mockUser = { id: 'admin-123', role: UserRole.admin, deletedAt: null } as User;
      userRepository.findOne.mockResolvedValue(mockUser);

      await expect(
        service.enforcePermission('admin-123', 'org-123', PERMISSIONS.PROPERTY_CREATE)
      ).resolves.not.toThrow();
    });

    it('should throw ForbiddenException when user lacks permission', async () => {
      const mockUser = { id: 'tenant-123', role: UserRole.tenant, deletedAt: null } as User;
      userRepository.findOne.mockResolvedValue(mockUser);
      roleRepository.find.mockResolvedValue([]);

      await expect(
        service.enforcePermission('tenant-123', 'org-123', PERMISSIONS.PROPERTY_CREATE)
      ).rejects.toThrow(ForbiddenException);
    });

    it('should include custom error message', async () => {
      const mockUser = { id: 'tenant-123', role: UserRole.tenant, deletedAt: null } as User;
      userRepository.findOne.mockResolvedValue(mockUser);
      roleRepository.find.mockResolvedValue([]);

      await expect(
        service.enforcePermission('tenant-123', 'org-123', PERMISSIONS.PROPERTY_CREATE, 'Custom error')
      ).rejects.toThrow('Custom error');
    });
  });

  describe('enforceAllPermissions', () => {
    it('should throw ForbiddenException when any permission is missing', async () => {
      const mockUser = { id: 'tenant-123', role: UserRole.tenant, deletedAt: null } as User;
      userRepository.findOne.mockResolvedValue(mockUser);
      roleRepository.find.mockResolvedValue([]);

      await expect(
        service.enforceAllPermissions('tenant-123', 'org-123', [
          PERMISSIONS.USER_VIEW_SELF,
          PERMISSIONS.PROPERTY_CREATE
        ])
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getUserRoleName', () => {
    it('should return role name for user in organization', async () => {
      const mockRole = { name: AGENT_ROLES.OWNER } as Role;
      roleRepository.findOne.mockResolvedValue(mockRole);

      const result = await service.getUserRoleName('user-123', 'org-123');

      expect(result).toBe(AGENT_ROLES.OWNER);
    });

    it('should return null when user has no role', async () => {
      roleRepository.findOne.mockResolvedValue(null);

      const result = await service.getUserRoleName('user-123', 'org-123');

      expect(result).toBeNull();
    });
  });

  describe('isOrganizationOwner', () => {
    it('should return true for owner', async () => {
      const mockRole = { name: AGENT_ROLES.OWNER } as Role;
      roleRepository.findOne.mockResolvedValue(mockRole);

      const result = await service.isOrganizationOwner('user-123', 'org-123');

      expect(result).toBe(true);
    });

    it('should return false for non-owner', async () => {
      const mockRole = { name: AGENT_ROLES.MANAGER } as Role;
      roleRepository.findOne.mockResolvedValue(mockRole);

      const result = await service.isOrganizationOwner('user-123', 'org-123');

      expect(result).toBe(false);
    });
  });

  describe('assignRole', () => {
    it('should create new role when user has no existing role', async () => {
      roleRepository.findOne.mockResolvedValue(null);
      roleRepository.save.mockResolvedValue({
        name: AGENT_ROLES.MANAGER,
        permissionGrants: ROLE_PERMISSIONS.MANAGER
      } as Role);

      const result = await service.assignRole('user-123', 'org-123', AGENT_ROLES.MANAGER);

      expect(roleRepository.create).toHaveBeenCalled();
      expect(result.name).toBe(AGENT_ROLES.MANAGER);
    });

    it('should update existing role', async () => {
      const existingRole = {
        id: 'role-123',
        name: AGENT_ROLES.SUPPORT,
        permissionGrants: []
      } as unknown as Role;

      roleRepository.findOne.mockResolvedValue(existingRole);
      roleRepository.save.mockResolvedValue({
        ...existingRole,
        name: AGENT_ROLES.MANAGER,
        permissionGrants: ROLE_PERMISSIONS.MANAGER
      } as Role);

      const result = await service.assignRole('user-123', 'org-123', AGENT_ROLES.MANAGER);

      expect(result.name).toBe(AGENT_ROLES.MANAGER);
    });

    it('should allow custom permissions', async () => {
      roleRepository.findOne.mockResolvedValue(null);
      const customPerms = [PERMISSIONS.TICKET_VIEW, PERMISSIONS.TICKET_COMMENT];
      roleRepository.save.mockResolvedValue({
        name: 'CUSTOM',
        permissionGrants: customPerms
      } as unknown as Role);

      const result = await service.assignRole('user-123', 'org-123', 'CUSTOM', customPerms);

      expect(result.permissionGrants).toEqual(customPerms);
    });
  });

  describe('removeRole', () => {
    it('should soft delete role', async () => {
      await service.removeRole('user-123', 'org-123');

      expect(roleRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          user: { id: 'user-123' },
          organization: { id: 'org-123' }
        }),
        expect.objectContaining({ deletedAt: expect.any(Date) })
      );
    });
  });

  describe('getOrganizationMembers', () => {
    it('should return members with roles', async () => {
      const mockRoles = [
        { user: { id: 'user-1', deletedAt: null }, name: AGENT_ROLES.OWNER },
        { user: { id: 'user-2', deletedAt: null }, name: AGENT_ROLES.MANAGER }
      ] as unknown as Role[];

      roleRepository.find.mockResolvedValue(mockRoles);

      const result = await service.getOrganizationMembers('org-123');

      expect(result).toHaveLength(2);
      expect(result[0].role.name).toBe(AGENT_ROLES.OWNER);
    });

    it('should filter out deleted users', async () => {
      const mockRoles = [
        { user: { id: 'user-1', deletedAt: null }, name: AGENT_ROLES.OWNER },
        { user: { id: 'user-2', deletedAt: new Date() }, name: AGENT_ROLES.MANAGER }
      ] as unknown as Role[];

      roleRepository.find.mockResolvedValue(mockRoles);

      const result = await service.getOrganizationMembers('org-123');

      expect(result).toHaveLength(1);
    });
  });

  describe('checkResourceAccess', () => {
    it('should allow access when organizations match', async () => {
      const mockUser = { id: 'admin-123', role: UserRole.admin, deletedAt: null } as User;
      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.checkResourceAccess(
        'admin-123',
        'org-123',
        'org-123',
        PERMISSIONS.PROPERTY_VIEW
      );

      expect(result).toBe(true);
    });

    it('should deny access when organizations differ for non-admin', async () => {
      const mockUser = { id: 'user-123', role: UserRole.agent, deletedAt: null } as User;
      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.checkResourceAccess(
        'user-123',
        'org-123',
        'org-456',
        PERMISSIONS.PROPERTY_VIEW
      );

      expect(result).toBe(false);
    });

    it('should allow cross-org access for admin', async () => {
      const mockUser = { id: 'admin-123', role: UserRole.admin, deletedAt: null } as User;
      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.checkResourceAccess(
        'admin-123',
        'org-123',
        'org-456',
        PERMISSIONS.PROPERTY_VIEW
      );

      expect(result).toBe(true);
    });
  });

  describe('utility methods', () => {
    it('should validate valid permission strings', () => {
      expect(service.isValidPermission(PERMISSIONS.PROPERTY_CREATE)).toBe(true);
      expect(service.isValidPermission('invalid:permission')).toBe(false);
    });

    it('should return all permissions', () => {
      const allPerms = service.getAllPermissions();
      expect(allPerms).toContain(PERMISSIONS.ALL);
      expect(allPerms).toContain(PERMISSIONS.PROPERTY_CREATE);
      expect(allPerms.length).toBeGreaterThan(20);
    });

    it('should group permissions by resource', () => {
      const grouped = service.getPermissionsByResource();
      expect(grouped['property']).toBeDefined();
      expect(grouped['ticket']).toBeDefined();
      expect(grouped['user']).toBeDefined();
      expect(grouped['property']).toContain(PERMISSIONS.PROPERTY_CREATE);
    });
  });
});
