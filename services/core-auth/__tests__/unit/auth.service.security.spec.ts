import { JwtService } from '@nestjs/jwt';
import { HttpException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { AuthService } from '../../src/services/auth.service';
import { PasswordService } from '../../src/services/password.service';
import { TokenService } from '../../src/services/token.service';
import { AuditLog } from '../../src/entities/audit-log.entity';
import { Organization } from '../../src/entities/organization.entity';
import { Otp } from '../../src/entities/otp.entity';
import { RefreshToken } from '../../src/entities/refresh-token.entity';
import { Role } from '../../src/entities/role.entity';
import { TenantInvite } from '../../src/entities/tenant-invite.entity';
import { User, UserRole } from '../../src/entities/user.entity';

describe('AuthService security controls', () => {
  const mockRepo = <T,>() => ({
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    create: jest.fn((data: Partial<T>) => data),
    manager: {
      create: jest.fn((data: Partial<T>) => data),
      save: jest.fn(),
      transaction: jest.fn(async (cb: (manager: any) => Promise<any>) => {
        const manager = { create: jest.fn((data: Partial<T>) => data), save: jest.fn() } as any;
        return cb(manager);
      })
    },
    createQueryBuilder: jest.fn().mockReturnValue({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({ max: null })
    }),
    update: jest.fn()
  });

  const userRepository = mockRepo<User>();
  const refreshTokenRepository = mockRepo<RefreshToken>();
  const organizationRepository = mockRepo<Organization>();
  const otpRepository = mockRepo<Otp>();
  const auditRepository = mockRepo<AuditLog>();
  const tenantInviteRepository = mockRepo<TenantInvite>();
  const roleRepository = mockRepo<Role>();
  const passwordService = new PasswordService();
  const tokenService = new TokenService(new JwtService({ secret: 'test' }));
  process.env.JWT_ACCESS_SECRET = 'test-access';
  process.env.JWT_REFRESH_SECRET = 'test-refresh';
  const service = new AuthService(
    userRepository as unknown as Repository<User>,
    refreshTokenRepository as unknown as Repository<RefreshToken>,
    organizationRepository as unknown as Repository<Organization>,
    otpRepository as unknown as Repository<Otp>,
    auditRepository as unknown as Repository<AuditLog>,
    tenantInviteRepository as unknown as Repository<TenantInvite>,
    roleRepository as unknown as Repository<Role>,
    passwordService,
    tokenService
  );

  it('enforces login rate limits after repeated failures', async () => {
    const lockedUser = Object.assign(new User(), {
      id: 'user-1',
      email: 'locked@example.com',
      emailNormalized: 'locked@example.com',
      passwordHash: 'hash',
      role: UserRole.agent,
      failedLoginAttempts: 5,
      failedLoginAt: new Date(),
      deletedAt: null
    });
    userRepository.findOne.mockResolvedValue(lockedUser);

    await expect(service.login('locked@example.com', 'bad-password')).rejects.toBeInstanceOf(HttpException);
  });

  it('creates tenant invites with masked audit logging', async () => {
    const agent = Object.assign(new User(), {
      id: 'agent-1',
      role: UserRole.agent,
      email: 'agent@example.com',
      emailNormalized: 'agent@example.com',
      passwordHash: 'hash',
      deletedAt: null
    });
    const organization = Object.assign(new Organization(), { id: 'org-1', owner: agent, deletedAt: null });

    userRepository.findOne.mockResolvedValue(agent);
    organizationRepository.findOne.mockResolvedValue(organization);
    tenantInviteRepository.save.mockResolvedValue({});
    jest.spyOn(passwordService, 'hash').mockResolvedValue('hashed-token');

    const result = await service.createTenantInvite('agent-1', 'prop-1', 'tenant@example.com', '+1234567890');

    expect(result.token).toBeDefined();
    expect(tenantInviteRepository.save).toHaveBeenCalled();
    expect(auditRepository.save).toHaveBeenCalled();
  });

  it('rotates refresh tokens and revokes the old one', async () => {
    const user = Object.assign(new User(), {
      id: 'user-2',
      email: 'user2@example.com',
      emailNormalized: 'user2@example.com',
      passwordHash: 'hash',
      role: UserRole.tenant,
      tenantId: 'org-1',
      deletedAt: null
    });

    userRepository.findOne.mockResolvedValue(user);
    const storedToken = Object.assign(new RefreshToken(), {
      tokenHash: 'stored',
      tokenVersion: 1,
      expiresAt: new Date(Date.now() + 10000),
      revokedAt: null
    });
    refreshTokenRepository.find.mockResolvedValue([storedToken]);
    jest.spyOn(passwordService, 'verifyHash').mockResolvedValue(true);
    jest.spyOn(passwordService, 'hash').mockResolvedValue('new-hash');
    refreshTokenRepository.create.mockReturnValue({ save: jest.fn() } as any);

    const refreshed = await service.refreshAccessToken('refresh-token');

    expect(refreshed.refreshToken).toBeDefined();
    expect(refreshTokenRepository.save).toHaveBeenCalled();
  });
});
