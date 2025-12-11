import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Role } from '../entities/role.entity';
import { User, UserRole } from '../entities/user.entity';
import {
  Permission,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  getPermissionsForRole,
  AgentRole,
  AGENT_ROLES
} from '../constants/permissions';

export interface PermissionContext {
  userId: string;
  organizationId: string;
  resourceOwnerId?: string;
  resourceOrganizationId?: string;
}

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {}

  /**
   * Get all effective permissions for a user within an organization
   */
  async getUserPermissions(userId: string, organizationId: string): Promise<Permission[]> {
    const user = await this.userRepository.findOne({
      where: { id: userId, deletedAt: IsNull() }
    });

    if (!user) {
      return [];
    }

    // Admin users have full access
    if (user.role === UserRole.admin) {
      return [PERMISSIONS.ALL];
    }

    // Get user's roles in this organization
    const roles = await this.roleRepository.find({
      where: {
        user: { id: userId },
        organization: { id: organizationId },
        deletedAt: IsNull()
      }
    });

    // Aggregate permissions from all roles
    const permissions = new Set<Permission>();

    for (const role of roles) {
      // Add permissions from role's permissionGrants (stored in DB)
      if (role.permissionGrants) {
        for (const grant of role.permissionGrants) {
          permissions.add(grant as Permission);
        }
      }

      // Also add default permissions for role name
      const defaultPerms = getPermissionsForRole(role.name);
      for (const perm of defaultPerms) {
        permissions.add(perm);
      }
    }

    // If no explicit roles, use default permissions based on user type
    if (roles.length === 0) {
      const defaultPerms = this.getDefaultPermissionsForUserRole(user.role);
      for (const perm of defaultPerms) {
        permissions.add(perm);
      }
    }

    return Array.from(permissions);
  }

  /**
   * Check if user has a specific permission
   */
  async checkPermission(
    userId: string,
    organizationId: string,
    permission: Permission
  ): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId, organizationId);
    return hasPermission(permissions, permission);
  }

  /**
   * Check if user has ALL specified permissions
   */
  async checkAllPermissions(
    userId: string,
    organizationId: string,
    requiredPermissions: Permission[]
  ): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId, organizationId);
    return hasAllPermissions(permissions, requiredPermissions);
  }

  /**
   * Check if user has ANY of the specified permissions
   */
  async checkAnyPermission(
    userId: string,
    organizationId: string,
    requiredPermissions: Permission[]
  ): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId, organizationId);
    return hasAnyPermission(permissions, requiredPermissions);
  }

  /**
   * Enforce permission - throws ForbiddenException if not allowed
   */
  async enforcePermission(
    userId: string,
    organizationId: string,
    permission: Permission,
    errorMessage?: string
  ): Promise<void> {
    const allowed = await this.checkPermission(userId, organizationId, permission);
    if (!allowed) {
      throw new ForbiddenException(errorMessage || `Missing permission: ${permission}`);
    }
  }

  /**
   * Enforce all permissions - throws ForbiddenException if any missing
   */
  async enforceAllPermissions(
    userId: string,
    organizationId: string,
    requiredPermissions: Permission[],
    errorMessage?: string
  ): Promise<void> {
    const allowed = await this.checkAllPermissions(userId, organizationId, requiredPermissions);
    if (!allowed) {
      throw new ForbiddenException(
        errorMessage || `Missing required permissions: ${requiredPermissions.join(', ')}`
      );
    }
  }

  /**
   * Get user's role name within an organization
   */
  async getUserRoleName(userId: string, organizationId: string): Promise<string | null> {
    const role = await this.roleRepository.findOne({
      where: {
        user: { id: userId },
        organization: { id: organizationId },
        deletedAt: IsNull()
      }
    });

    return role?.name || null;
  }

  /**
   * Check if user is organization owner
   */
  async isOrganizationOwner(userId: string, organizationId: string): Promise<boolean> {
    const roleName = await this.getUserRoleName(userId, organizationId);
    return roleName === AGENT_ROLES.OWNER;
  }

  /**
   * Assign a role to user within organization
   */
  async assignRole(
    userId: string,
    organizationId: string,
    roleName: AgentRole | string,
    customPermissions?: Permission[]
  ): Promise<Role> {
    // Check if user already has a role in this organization
    const existingRole = await this.roleRepository.findOne({
      where: {
        user: { id: userId },
        organization: { id: organizationId },
        deletedAt: IsNull()
      }
    });

    if (existingRole) {
      // Update existing role
      existingRole.name = roleName;
      existingRole.permissionGrants = customPermissions || getPermissionsForRole(roleName);
      return this.roleRepository.save(existingRole);
    }

    // Create new role
    const role = this.roleRepository.create({
      name: roleName,
      user: { id: userId } as User,
      organization: { id: organizationId } as any,
      permissionGrants: customPermissions || getPermissionsForRole(roleName)
    });

    return this.roleRepository.save(role);
  }

  /**
   * Remove user's role from organization
   */
  async removeRole(userId: string, organizationId: string): Promise<void> {
    await this.roleRepository.update(
      {
        user: { id: userId },
        organization: { id: organizationId },
        deletedAt: IsNull()
      },
      { deletedAt: new Date() }
    );
  }

  /**
   * Get all members with roles in an organization
   */
  async getOrganizationMembers(
    organizationId: string
  ): Promise<Array<{ user: User; role: Role }>> {
    const roles = await this.roleRepository.find({
      where: {
        organization: { id: organizationId },
        deletedAt: IsNull()
      },
      relations: ['user']
    });

    return roles
      .filter((role) => role.user && !role.user.deletedAt)
      .map((role) => ({ user: role.user, role }));
  }

  /**
   * Check resource-level access (e.g., can user access this property?)
   */
  async checkResourceAccess(
    userId: string,
    organizationId: string,
    resourceOrganizationId: string,
    permission: Permission
  ): Promise<boolean> {
    // User must belong to the same organization as the resource
    if (organizationId !== resourceOrganizationId) {
      // Check if user is admin (cross-org access)
      const user = await this.userRepository.findOne({
        where: { id: userId, deletedAt: IsNull() }
      });

      if (user?.role !== UserRole.admin) {
        return false;
      }
    }

    return this.checkPermission(userId, organizationId, permission);
  }

  /**
   * Get default permissions based on user's base role (tenant, agent, contractor)
   */
  private getDefaultPermissionsForUserRole(userRole: UserRole): Permission[] {
    switch (userRole) {
      case UserRole.admin:
        return [PERMISSIONS.ALL];
      case UserRole.agent:
        // Agents without explicit role get basic view permissions
        return [
          PERMISSIONS.ORG_VIEW,
          PERMISSIONS.PROPERTY_VIEW,
          PERMISSIONS.TENANT_VIEW,
          PERMISSIONS.TICKET_VIEW,
          PERMISSIONS.USER_VIEW_SELF,
          PERMISSIONS.USER_UPDATE_SELF
        ];
      case UserRole.contractor:
        return ROLE_PERMISSIONS.CONTRACTOR;
      case UserRole.tenant:
        return ROLE_PERMISSIONS.TENANT;
      default:
        return [PERMISSIONS.USER_VIEW_SELF];
    }
  }

  /**
   * Validate that a permission string is valid
   */
  isValidPermission(permission: string): permission is Permission {
    return Object.values(PERMISSIONS).includes(permission as Permission);
  }

  /**
   * Get all available permissions
   */
  getAllPermissions(): Permission[] {
    return Object.values(PERMISSIONS);
  }

  /**
   * Get permissions grouped by resource
   */
  getPermissionsByResource(): Record<string, Permission[]> {
    const grouped: Record<string, Permission[]> = {};

    for (const permission of Object.values(PERMISSIONS)) {
      if (permission === '*') {
        grouped['all'] = grouped['all'] || [];
        grouped['all'].push(permission);
        continue;
      }

      const [resource] = permission.split(':');
      grouped[resource] = grouped[resource] || [];
      grouped[resource].push(permission);
    }

    return grouped;
  }
}
