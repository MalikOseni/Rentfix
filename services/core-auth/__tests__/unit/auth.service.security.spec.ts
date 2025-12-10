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
import { User, UserRole } from '../../src/entities/user.entity';

describe('AuthService security controls', () => {
  const mockRepo = <T,>() => ({
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    create: jest.fn((data: Partial<T>) => data),
    manager: { create: jest.fn(), save: jest.fn() },
    createQueryBuilder: jest.fn().mockReturnValue({
      where: jest.fn().mockReturnThis(),
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
  const passwordService = new PasswordService();
  const tokenService = new TokenService(new JwtService({ secret: 'test' }));
  const service = new AuthService(
    userRepository as unknown as Repository<User>,
    refreshTokenRepository as unknown as Repository<RefreshToken>,
    organizationRepository as unknown as Repository<Organization>,
    otpRepository as unknown as Repository<Otp>,
    auditRepository as unknown as Repository<AuditLog>,
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
});
