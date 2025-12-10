import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
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
import { RegisterDto } from '../../src/dto/register.dto';
import { VerifyOtpDto } from '../../src/dto/verify-otp.dto';

describe('AuthService', () => {
  let service: AuthService;
  let userRepo: Repository<User>;

  beforeAll(() => {
    process.env.JWT_ACCESS_SECRET = 'test-access';
    process.env.JWT_REFRESH_SECRET = 'test-refresh';
  });

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        PasswordService,
        TokenService,
        { provide: JwtService, useValue: new JwtService({ secret: 'test' }) },
        { provide: getRepositoryToken(User), useClass: Repository },
        { provide: getRepositoryToken(RefreshToken), useClass: Repository },
        { provide: getRepositoryToken(Organization), useClass: Repository },
        { provide: getRepositoryToken(Otp), useClass: Repository },
        { provide: getRepositoryToken(AuditLog), useClass: Repository },
        { provide: getRepositoryToken(TenantInvite), useClass: Repository },
        { provide: getRepositoryToken(Role), useClass: Repository }
      ]
    }).compile();

    service = moduleRef.get(AuthService);
    userRepo = moduleRef.get(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(userRepo).toBeDefined();
  });

  describe('core flows', () => {
    const mockRepo = <T,>() => ({
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      create: jest.fn((data: Partial<T>) => data),
      manager: {
        create: jest.fn((data: Partial<T>) => data),
        save: jest.fn(),
        transaction: jest.fn(async (cb: (manager: any) => Promise<any>) => cb({ create: jest.fn((d: any) => d), save: jest.fn() }))
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

    let flowService: AuthService;

    beforeAll(() => {
      process.env.JWT_ACCESS_SECRET = 'flow-access';
      process.env.JWT_REFRESH_SECRET = 'flow-refresh';
    });

    beforeEach(() => {
      flowService = new AuthService(
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
    });

    it('registers new users and stores tokens', async () => {
      jest.spyOn(passwordService, 'hash').mockResolvedValue('hashed');
      jest.spyOn(passwordService, 'verifyHash').mockResolvedValue(true);
      jest.spyOn(tokenService, 'generateTokens').mockResolvedValue({
        accessToken: 'access',
        refreshToken: 'refresh',
        expiresIn: 900,
        tokenType: 'Bearer'
      });

      const dto: RegisterDto = {
        email: 'flow@example.com',
        password: 'ComplexPassword!123',
        role: UserRole.tenant
      } as RegisterDto;
      userRepository.findOne.mockResolvedValue(null);
      userRepository.save.mockResolvedValue({ ...dto, id: 'flow-user', tenantId: null } as unknown as User);
      refreshTokenRepository.save.mockResolvedValue({});

      const result = await flowService.register(dto);

      expect(result.accessToken).toBeDefined();
      expect(userRepository.save).toHaveBeenCalled();
      expect(refreshTokenRepository.save).toHaveBeenCalled();
    });

    it('verifies OTP for a user', async () => {
      jest.spyOn(passwordService, 'hash').mockResolvedValue('hashed');
      jest.spyOn(passwordService, 'verifyHash').mockResolvedValue(true);
      jest.spyOn(tokenService, 'generateTokens').mockResolvedValue({
        accessToken: 'access',
        refreshToken: 'refresh',
        expiresIn: 900,
        tokenType: 'Bearer'
      });

      const user = Object.assign(new User(), {
        id: 'otp-flow',
        email: 'otp-flow@example.com',
        emailNormalized: 'otp-flow@example.com',
        passwordHash: 'hash',
        role: UserRole.agent,
        tenantId: null,
        deletedAt: null
      });
      const otpRecord = Object.assign(new Otp(), {
        otpHash: 'otp-hash',
        temporaryTokenHash: 'temp-hash',
        expiresAt: new Date(Date.now() + 1000),
        usedAt: null,
        useCount: 0,
        user
      });

      otpRepository.find.mockResolvedValue([otpRecord]);
      const dto: VerifyOtpDto = { otp: '123456', temporaryToken: 'temp-token' } as VerifyOtpDto;

      const result = await flowService.verifyOtp(dto);
      expect(result.accessToken).toBeDefined();
      expect(userRepository.save).toHaveBeenCalled();
    });

    it('logs in a user and resets failure counters', async () => {
      jest.spyOn(passwordService, 'verifyHash').mockResolvedValue(true);
      jest.spyOn(tokenService, 'generateTokens').mockResolvedValue({
        accessToken: 'access',
        refreshToken: 'refresh',
        expiresIn: 900,
        tokenType: 'Bearer'
      });

      const user = Object.assign(new User(), {
        id: 'login-user',
        email: 'login@example.com',
        emailNormalized: 'login@example.com',
        passwordHash: 'hash',
        role: UserRole.agent,
        tenantId: null,
        failedLoginAttempts: 2,
        failedLoginAt: new Date(),
        deletedAt: null
      });
      userRepository.findOne.mockResolvedValue(user);
      refreshTokenRepository.save.mockResolvedValue({});

      const tokens = await flowService.login('login@example.com', 'password');
      expect(tokens.accessToken).toBeDefined();
      expect(userRepository.save).toHaveBeenCalled();
    });

    it('creates and accepts tenant invites', async () => {
      jest.spyOn(passwordService, 'hash').mockResolvedValue('hashed');
      jest.spyOn(passwordService, 'verifyHash').mockResolvedValue(true);
      jest.spyOn(tokenService, 'generateTokens').mockResolvedValue({
        accessToken: 'access',
        refreshToken: 'refresh',
        expiresIn: 900,
        tokenType: 'Bearer'
      });

      const agent = Object.assign(new User(), {
        id: 'agent-1',
        role: UserRole.agent,
        email: 'agent@example.com',
        emailNormalized: 'agent@example.com',
        passwordHash: 'hash',
        tenantId: null,
        deletedAt: null
      });
      const organization = Object.assign(new Organization(), { id: 'org-1', owner: agent, deletedAt: null });
      userRepository.findOne.mockResolvedValueOnce(agent);
      organizationRepository.findOne.mockResolvedValue(organization);
      tenantInviteRepository.save.mockResolvedValue({});

      const invite = await flowService.createTenantInvite('agent-1', 'prop-1', 'tenant@example.com', '+123');
      expect(invite.token).toBeDefined();

      const tenantInvite = Object.assign(new TenantInvite(), {
        tokenHash: 'hashed',
        organization,
        invitedEmail: 'tenant@example.com',
        invitedPhone: '+123',
        expiresAt: new Date(Date.now() + 10000),
        acceptedAt: null,
        invitedBy: agent
      });
      tenantInviteRepository.find.mockResolvedValue([tenantInvite]);
      tenantInviteRepository.manager.transaction = jest.fn(async (cb: (manager: any) => Promise<any>) =>
        cb({ create: (data: any) => data, save: async (data: any) => data })
      );

      await flowService.acceptTenantInvite(invite.token, 'Tenant User', 'Password!23456', '+123');
      expect(tenantInviteRepository.manager.transaction).toHaveBeenCalled();
    });

    it('refreshes tokens with rotation', async () => {
      jest.spyOn(tokenService, 'verifyRefresh').mockReturnValue({ sub: 'user-rot', token_version: 1 });
      jest.spyOn(tokenService, 'generateTokens').mockResolvedValue({
        accessToken: 'access',
        refreshToken: 'refresh-new',
        expiresIn: 900,
        tokenType: 'Bearer'
      });
      const user = Object.assign(new User(), {
        id: 'user-rot',
        email: 'rot@example.com',
        emailNormalized: 'rot@example.com',
        passwordHash: 'hash',
        role: UserRole.agent,
        tenantId: null,
        deletedAt: null
      });
      userRepository.findOne.mockResolvedValue(user);
      const storedToken = Object.assign(new RefreshToken(), {
        tokenHash: 'stored',
        tokenVersion: 1,
        expiresAt: new Date(Date.now() + 1000),
        revokedAt: null
      });
      refreshTokenRepository.find.mockResolvedValue([storedToken]);
      jest.spyOn(passwordService, 'verifyHash').mockResolvedValue(true);

      const tokens = await flowService.refreshAccessToken('refresh');
      expect(tokens.refreshToken).toBeDefined();
    });

    it('registers contractors with pending status', async () => {
      const result = await flowService.registerContractor('Biz LLC', ['hvac'], 100, undefined, '123456');
      expect(result.status).toBe('PENDING');
    });
  });
});
