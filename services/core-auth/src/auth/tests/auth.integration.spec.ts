import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { TypeOrmModule, getDataSourceToken } from '@nestjs/typeorm';
import request from 'supertest';
import { DataSource, DataSourceOptions, Repository } from 'typeorm';
import { newDb } from 'pg-mem';
import { ConfigModule } from '@rentfix/config';
import { randomUUID } from 'crypto';

jest.mock(
  '@rentfix/config',
  () => ({
    ConfigModule: { register: () => ({ module: class MockConfigModule {} }) }
  }),
  { virtual: true }
);

jest.mock(
  'dd-trace',
  () => ({
    init: jest.fn(),
    tracer: jest.fn()
  }),
  { virtual: true }
);
import { AuthController } from '../../controllers/auth.controller';
import { AuditLog } from '../../entities/audit-log.entity';
import { Organization } from '../../entities/organization.entity';
import { Otp } from '../../entities/otp.entity';
import { Permission } from '../../entities/permission.entity';
import { RefreshToken } from '../../entities/refresh-token.entity';
import { Role } from '../../entities/role.entity';
import { TenantInvite } from '../../entities/tenant-invite.entity';
import { User, UserRole } from '../../entities/user.entity';
import { LoginAttemptEntity } from '../../database/entities/login-attempt.entity';
import { RateLimitGuard } from '../../shared/guards/rate-limit.guard';
import { TenantGuard } from '../../shared/guards/tenant.guard';
import { RbacGuard } from '../../shared/guards/rbac.guard';
import { AuthService } from '../../services/auth.service';
import { PasswordService } from '../../services/password.service';
import { TokenService } from '../../services/token.service';
import { DeleteAccountDto } from '../../dto/delete-account.dto';
import { RegisterDto } from '../../dto/register.dto';
import { LoginDto } from '../../dto/login.dto';
import { VerifyOtpDto } from '../../dto/verify-otp.dto';
import { CreateInviteDto } from '../../dto/create-invite.dto';
import { AcceptInviteDto } from '../../dto/accept-invite.dto';
import { RegisterContractorDto } from '../../dto/register-contractor.dto';

jest.setTimeout(45000);

const ENTITIES = [AuditLog, Organization, Otp, Permission, RefreshToken, Role, TenantInvite, User, LoginAttemptEntity];

const STRONG_PASSWORD = 'Sufficiently$Secure1';

describe('AuthController (integration)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let userRepo: Repository<User>;
  let otpRepo: Repository<Otp>;
  let refreshRepo: Repository<RefreshToken>;
  let inviteRepo: Repository<TenantInvite>;
  let auditRepo: Repository<AuditLog>;

  beforeAll(async () => {
    process.env.JWT_ACCESS_SECRET = 'test-access-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
    process.env.JWT_ACCESS_EXPIRES_IN = '15m';
    process.env.JWT_REFRESH_EXPIRES_IN = '7d';

    const moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRootAsync({
          useFactory: async () => {
            const db = newDb({ autoCreateForeignKeyIndices: true });
            db.public.registerFunction({ name: 'current_database', returns: 'text' as any, implementation: () => 'pg-mem' });
            db.public.registerFunction({ name: 'version', returns: 'text' as any, implementation: () => 'pg-mem' });
            db.public.registerFunction({
              name: 'uuid_generate_v4',
              returns: 'uuid' as any,
              implementation: () => randomUUID()
            });
            const dataSource = db.adapters.createTypeormDataSource({
              type: 'postgres',
              entities: ENTITIES,
              synchronize: true,
              dropSchema: false
            } as DataSourceOptions);
            await dataSource.initialize();

            return {
              type: 'postgres',
              entities: ENTITIES,
              synchronize: true,
              dropSchema: false,
              dataSourceFactory: async () => dataSource
            };
          }
        }),
        TypeOrmModule.forFeature(ENTITIES),
        JwtModule.register({})
      ],
      controllers: [AuthController],
      providers: [
        AuthService,
        PasswordService,
        TokenService,
        RateLimitGuard,
        TenantGuard,
        RbacGuard,
        Reflector
      ]
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    dataSource = app.get<DataSource>(getDataSourceToken());
    userRepo = dataSource.getRepository(User);
    otpRepo = dataSource.getRepository(Otp);
    refreshRepo = dataSource.getRepository(RefreshToken);
    inviteRepo = dataSource.getRepository(TenantInvite);
    auditRepo = dataSource.getRepository(AuditLog);
  });

  beforeEach(async () => {
    await dataSource.synchronize(true);
    (app.get(RateLimitGuard) as any).attempts?.clear?.();
  });

  afterAll(async () => {
    await app?.close();
  });

  const buildRegisterPayload = (overrides: Partial<RegisterDto> = {}): RegisterDto => ({
    email: 'user@example.com',
    password: STRONG_PASSWORD,
    role: UserRole.tenant,
    ...overrides
  });

  const createUser = async (overrides: Partial<User> & { password?: string } = {}) => {
    const passwordService = app.get(PasswordService);
    const user = userRepo.create({
      email: overrides.email ?? 'tester@example.com',
      emailNormalized: (overrides.email ?? 'tester@example.com').toLowerCase(),
      passwordHash: await passwordService.hash(overrides.password ?? STRONG_PASSWORD),
      role: overrides.role ?? UserRole.tenant,
      tenantId: overrides.tenantId ?? null,
      firstName: overrides.firstName ?? 'Test',
      lastName: overrides.lastName ?? 'User',
      phone: overrides.phone ?? null,
      emailVerified: overrides.emailVerified ?? true,
      failedLoginAttempts: overrides.failedLoginAttempts ?? 0,
      failedLoginAt: overrides.failedLoginAt ?? null,
      deletedAt: overrides.deletedAt ?? null
    });
    return userRepo.save(user);
  };

  const createAgentWithOrg = async () => {
    const agent = await createUser({ role: UserRole.agent, email: 'agent@example.com' });
    const org = dataSource.getRepository(Organization).create({
      name: 'Agent Org',
      owner: agent,
      companyRegistrationNumber: '12345',
      plan: 'pro',
      status: 'active',
      propertiesQuota: 5
    });
    await dataSource.getRepository(Organization).save(org);
    return agent;
  };

  const issueOtpForUser = async (user: User) => {
    const passwordService = app.get(PasswordService);
    const otpCode = '123456';
    const temporaryToken = 'temp-token';
    const otpEntity = otpRepo.create({
      user,
      otpHash: await passwordService.hash(otpCode),
      temporaryTokenHash: await passwordService.hash(temporaryToken),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      usedAt: null,
      useCount: 0
    });
    await otpRepo.save(otpEntity);
    return { otpCode, temporaryToken };
  };

  describe('register', () => {
    it('registers a new tenant and returns tokens', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/auth/register')
        .send(buildRegisterPayload());

      expect(response.status).toBe(201);
      expect(response.body.accessToken).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();

      const saved = await userRepo.findOne({ where: { email: 'user@example.com' } });
      expect(saved).toBeTruthy();
      expect(saved?.emailVerified).toBe(false);
    });

    it('rejects duplicate email registrations', async () => {
      await createUser({ email: 'user@example.com' });

      const response = await request(app.getHttpServer())
        .post('/v1/auth/register')
        .send(buildRegisterPayload());

      expect(response.status).toBe(409);
    });

    it('enforces validation rules on password complexity', async () => {
      const payload = buildRegisterPayload({ password: 'short' });
      const response = await request(app.getHttpServer())
        .post('/v1/auth/register')
        .send(payload);

      expect(response.status).toBe(400);
    });

    it('applies rate limiting after repeated attempts', async () => {
      const payload = buildRegisterPayload({ email: 'unique@example.com' });
      for (let i = 0; i < 3; i++) {
        const res = await request(app.getHttpServer()).post('/v1/auth/register').send({ ...payload, email: `u${i}@example.com` });
        expect(res.status).not.toBe(429);
      }

      const response = await request(app.getHttpServer())
        .post('/v1/auth/register')
        .send({ ...payload, email: 'u3@example.com' });

      expect(response.status).toBe(429);
    });
  });

  describe('verify-otp', () => {
    it('verifies OTP and marks email as verified', async () => {
      const user = await createUser({ emailVerified: false });
      const { otpCode, temporaryToken } = await issueOtpForUser(user);

      const payload: VerifyOtpDto = { otp: otpCode, temporaryToken };
      const response = await request(app.getHttpServer()).post('/v1/auth/verify-otp').send(payload);

      expect(response.status).toBe(200);
      const updated = await userRepo.findOneByOrFail({ id: user.id });
      expect(updated.emailVerified).toBe(true);
    });

    it('rejects invalid OTP payloads', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/auth/verify-otp')
        .send({ otp: '12', temporaryToken: 123 });

      expect(response.status).toBe(400);
    });

    it('returns unauthorized for expired OTPs', async () => {
      const user = await createUser({ emailVerified: false });
      const passwordService = app.get(PasswordService);
      const expired = otpRepo.create({
        user,
        otpHash: await passwordService.hash('111111'),
        temporaryTokenHash: await passwordService.hash('expired'),
        expiresAt: new Date(Date.now() - 1000),
        usedAt: null,
        useCount: 0
      });
      await otpRepo.save(expired);

      const response = await request(app.getHttpServer())
        .post('/v1/auth/verify-otp')
        .send({ otp: '111111', temporaryToken: 'expired' });

      expect(response.status).toBe(401);
    });

    it('blocks OTP verification for deleted users', async () => {
      const user = await createUser({ emailVerified: false, deletedAt: new Date() });
      const { otpCode, temporaryToken } = await issueOtpForUser(user);

      const response = await request(app.getHttpServer())
        .post('/v1/auth/verify-otp')
        .send({ otp: otpCode, temporaryToken });

      expect(response.status).toBe(401);
    });
  });

  describe('login', () => {
    it('logs in with valid credentials', async () => {
      await createUser({ email: 'login@example.com' });

      const payload: LoginDto = { email: 'login@example.com', password: STRONG_PASSWORD };
      const response = await request(app.getHttpServer()).post('/v1/auth/login').send(payload);

      expect(response.status).toBe(200);
      expect(response.body.accessToken).toBeDefined();
    });

    it('rejects invalid credentials and increments failed attempts', async () => {
      const user = await createUser({ email: 'fail@example.com' });

      const response = await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({ email: 'fail@example.com', password: 'WrongPassword1!' });

      expect(response.status).toBe(401);
      const updated = await userRepo.findOneByOrFail({ id: user.id });
      expect(updated.failedLoginAttempts).toBe(1);
    });

    it('locks out after multiple guard triggers', async () => {
      await createUser({ email: 'locked@example.com' });
      const payload = { email: 'locked@example.com', password: 'WrongPassword1!' };

      for (let i = 0; i < 5; i++) {
        const res = await request(app.getHttpServer()).post('/v1/auth/login').send(payload);
        expect(res.status).toBe(401);
      }

      const blocked = await request(app.getHttpServer()).post('/v1/auth/login').send(payload);
      expect(blocked.status).toBe(429);
    });

    it('applies account-level lock when attempts exceed window', async () => {
      const user = await createUser({
        email: 'rate@example.com',
        failedLoginAttempts: 5,
        failedLoginAt: new Date()
      });

      const response = await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({ email: user.email, password: STRONG_PASSWORD });

      expect(response.status).toBe(429);
    });

    it('prevents login for soft-deleted users', async () => {
      await createUser({ email: 'deleted@example.com', deletedAt: new Date() });

      const response = await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({ email: 'deleted@example.com', password: STRONG_PASSWORD });

      expect(response.status).toBe(401);
    });
  });

  describe('refresh', () => {
    it('rotates refresh tokens for valid sessions', async () => {
      const user = await createUser({ email: 'refresh@example.com' });
      const loginRes = await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({ email: user.email, password: STRONG_PASSWORD });

      const refreshRes = await request(app.getHttpServer())
        .post('/v1/auth/refresh')
        .send({ refreshToken: loginRes.body.refreshToken });

      expect(refreshRes.status).toBe(200);
      const tokens = await refreshRepo.find({ where: { user: { id: user.id } } });
      expect(tokens.length).toBe(2);
      expect(tokens.filter((t) => t.revokedAt === null).length).toBe(1);
    });

    it('revokes all sessions when refresh token is invalid', async () => {
      const user = await createUser({ email: 'invalid-refresh@example.com' });
      const loginRes = await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({ email: user.email, password: STRONG_PASSWORD });

      const response = await request(app.getHttpServer())
        .post('/v1/auth/refresh')
        .send({ refreshToken: `${loginRes.body.refreshToken}tampered` });

      expect(response.status).toBe(401);
      const tokens = await refreshRepo.find({ where: { user: { id: user.id } } });
      expect(tokens.every((t) => t.revokedAt !== null)).toBe(true);
    });
  });

  describe('delete account', () => {
    it('soft deletes the account and revokes sessions', async () => {
      const user = await createUser({ email: 'delete@example.com' });
      const loginRes = await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({ email: user.email, password: STRONG_PASSWORD });

      const payload: DeleteAccountDto = { userId: user.id, password: STRONG_PASSWORD };
      const response = await request(app.getHttpServer())
        .delete('/v1/auth/api/users/me/delete')
        .send(payload);

      expect(response.status).toBe(200);
      const deleted = await userRepo.findOneByOrFail({ id: user.id });
      expect(deleted.deletedAt).not.toBeNull();

      const tokens = await refreshRepo.find({ where: { user: { id: user.id } } });
      expect(tokens.every((t) => t.revokedAt !== null)).toBe(true);
    });

    it('rejects deletion with incorrect password', async () => {
      const user = await createUser({ email: 'delete-fail@example.com' });
      const payload: DeleteAccountDto = { userId: user.id, password: 'WrongPassword1!' };
      const response = await request(app.getHttpServer())
        .delete('/v1/auth/api/users/me/delete')
        .send(payload);

      expect(response.status).toBe(401);
    });

    it('returns not found when account already deleted', async () => {
      const user = await createUser({ email: 'already-deleted@example.com', deletedAt: new Date() });
      const payload: DeleteAccountDto = { userId: user.id, password: STRONG_PASSWORD };
      const response = await request(app.getHttpServer())
        .delete('/v1/auth/api/users/me/delete')
        .send(payload);

      expect(response.status).toBe(404);
    });
  });

  describe('tenant invite', () => {
    it('creates a tenant invite when agent owns organization', async () => {
      const agent = await createAgentWithOrg();
      const payload: CreateInviteDto = {
        agentId: agent.id,
        propertyId: 'property-1',
        tenantEmail: 'tenant@example.com',
        tenantPhone: '+12345678901'
      };

      const response = await request(app.getHttpServer()).post('/v1/auth/tenant/invite').send(payload);

      expect(response.status).toBe(201);
      expect(response.body.token).toBeDefined();
      const invites = await inviteRepo.find();
      expect(invites).toHaveLength(1);
    });

    it('validates invite payloads', async () => {
      const response = await request(app.getHttpServer()).post('/v1/auth/tenant/invite').send({});
      expect(response.status).toBe(400);
    });

    it('rejects invites from non-agents', async () => {
      const tenant = await createUser({ role: UserRole.tenant, email: 'tenant-inviter@example.com' });
      const payload: CreateInviteDto = {
        agentId: tenant.id,
        propertyId: 'prop-2',
        tenantEmail: 'guest@example.com'
      } as CreateInviteDto;

      const response = await request(app.getHttpServer()).post('/v1/auth/tenant/invite').send(payload);
      expect(response.status).toBe(403);
    });
  });

  describe('accept invite', () => {
    it('creates a tenant user from invite', async () => {
      const agent = await createAgentWithOrg();
      const inviteResponse = await request(app.getHttpServer())
        .post('/v1/auth/tenant/invite')
        .send({ agentId: agent.id, propertyId: 'prop-1', tenantEmail: 'invitee@example.com' });

      const payload: AcceptInviteDto = {
        token: inviteResponse.body.token,
        name: 'Invited User',
        password: STRONG_PASSWORD,
        phone: '+15555555555'
      };

      const response = await request(app.getHttpServer()).post('/v1/auth/tenant/accept-invite').send(payload);

      expect(response.status).toBe(201);
      const tenant = await userRepo.findOne({ where: { email: 'invitee@example.com' } });
      expect(tenant).toBeTruthy();
    });

    it('rejects expired invites', async () => {
      const agent = await createAgentWithOrg();
      const passwordService = app.get(PasswordService);
      const invite = inviteRepo.create({
        invitedBy: agent,
        organization: await dataSource.getRepository(Organization).findOneByOrFail({ owner: { id: agent.id } }),
        invitedEmail: 'late@example.com',
        propertyId: 'prop',
        tokenHash: await passwordService.hash('expired-token'),
        expiresAt: new Date(Date.now() - 1000),
        acceptedAt: null
      });
      await inviteRepo.save(invite);

      const response = await request(app.getHttpServer())
        .post('/v1/auth/tenant/accept-invite')
        .send({ token: 'expired-token', name: 'Late User', password: STRONG_PASSWORD, phone: '+1234567890' });

      expect(response.status).toBe(401);
    });

    it('validates invite acceptance payloads', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/auth/tenant/accept-invite')
        .send({ token: 'x', name: '', password: 'short', phone: 123 });

      expect(response.status).toBe(400);
    });
  });

  describe('contractor register', () => {
    it('returns pending status for contractor onboarding', async () => {
      const payload: RegisterContractorDto = {
        businessName: 'ACME Repairs',
        specialties: ['plumbing'],
        hourlyRate: 120,
        insuranceCertUrl: 'http://example.com/cert.pdf',
        bankAccount: '123456789'
      };

      const response = await request(app.getHttpServer()).post('/v1/auth/contractor/register').send(payload);
      expect(response.status).toBe(201);
      expect(response.body.status).toBe('PENDING');
      const audit = await auditRepo.find();
      expect(audit.some((entry) => entry.action === 'CONTRACTOR_REGISTERED')).toBe(true);
    });

    it('enforces contractor payload validation', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/auth/contractor/register')
        .send({ businessName: '', specialties: 'not-an-array', hourlyRate: 0, bankAccount: '123' });

      expect(response.status).toBe(400);
    });
  });
});
