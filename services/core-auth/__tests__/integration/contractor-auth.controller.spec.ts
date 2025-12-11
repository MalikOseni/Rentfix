import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { getRepositoryToken, getDataSourceToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { JwtService, JwtModule } from '@nestjs/jwt';
import { AuthController } from '../../src/controllers/auth.controller';
import { AuthService } from '../../src/services/auth.service';
import { ContractorAuthService } from '../../src/services/contractor-auth.service';
import { PasswordService } from '../../src/services/password.service';
import { TokenService } from '../../src/services/token.service';
import { User, UserRole } from '../../src/entities/user.entity';
import { Contractor, ContractorStatus, BackgroundCheckStatus } from '../../src/entities/contractor.entity';
import { Organization } from '../../src/entities/organization.entity';
import { Role } from '../../src/entities/role.entity';
import { Otp } from '../../src/entities/otp.entity';
import { RefreshToken } from '../../src/entities/refresh-token.entity';
import { AuditLog } from '../../src/entities/audit-log.entity';
import { TenantInvite } from '../../src/entities/tenant-invite.entity';

describe('AuthController - Contractor Endpoints (Integration)', () => {
  let app: INestApplication;
  let authService: AuthService;
  let contractorAuthService: ContractorAuthService;

  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      create: jest.fn((entity: any, data: any) => ({ ...data, id: 'mock-id' })),
      save: jest.fn((data: any) => Promise.resolve({ ...data, id: data.id || 'mock-id' }))
    }
  };

  const mockRepository = () => ({
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn((data: any) => Promise.resolve({ ...data, id: data.id || 'mock-id' })),
    create: jest.fn((data: any) => data),
    update: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({ max: null })
    }),
    manager: {
      create: jest.fn((data: any) => data),
      save: jest.fn((data: any) => Promise.resolve(data)),
      transaction: jest.fn(async (cb: any) => cb({ create: (d: any) => d, save: async (d: any) => d }))
    }
  });

  beforeAll(() => {
    process.env.JWT_ACCESS_SECRET = 'test-access-secret-for-integration-tests';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-for-integration-tests';
  });

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [JwtModule.register({ secret: 'test' })],
      controllers: [AuthController],
      providers: [
        AuthService,
        ContractorAuthService,
        PasswordService,
        TokenService,
        { provide: getRepositoryToken(User), useFactory: mockRepository },
        { provide: getRepositoryToken(Contractor), useFactory: mockRepository },
        { provide: getRepositoryToken(Organization), useFactory: mockRepository },
        { provide: getRepositoryToken(Role), useFactory: mockRepository },
        { provide: getRepositoryToken(Otp), useFactory: mockRepository },
        { provide: getRepositoryToken(RefreshToken), useFactory: mockRepository },
        { provide: getRepositoryToken(AuditLog), useFactory: mockRepository },
        { provide: getRepositoryToken(TenantInvite), useFactory: mockRepository },
        {
          provide: getDataSourceToken(),
          useValue: {
            createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
            query: jest.fn()
          }
        }
      ]
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    authService = moduleRef.get<AuthService>(AuthService);
    contractorAuthService = moduleRef.get<ContractorAuthService>(ContractorAuthService);
  });

  afterEach(async () => {
    await app.close();
    jest.clearAllMocks();
  });

  describe('POST /v1/auth/contractor/signup', () => {
    const validSignupDto = {
      email: 'contractor@test.com',
      password: 'SecurePassword123!',
      businessName: 'Test Plumbing LLC',
      firstName: 'John',
      lastName: 'Doe',
      phone: '+447700900123',
      specialties: ['plumbing', 'hvac'],
      hourlyRate: 50,
      bankAccount: '12345678'
    };

    it('should register a new contractor successfully', async () => {
      jest.spyOn(contractorAuthService, 'signup').mockResolvedValue({
        temporaryToken: 'temp-token',
        otpExpiresAt: new Date(Date.now() + 600000),
        otpDelivery: { email: validSignupDto.email },
        contractorId: 'contractor-123',
        status: ContractorStatus.PENDING
      });

      const response = await request(app.getHttpServer())
        .post('/v1/auth/contractor/signup')
        .send(validSignupDto)
        .expect(HttpStatus.CREATED);

      expect(response.body.temporaryToken).toBe('temp-token');
      expect(response.body.contractorId).toBe('contractor-123');
      expect(response.body.status).toBe(ContractorStatus.PENDING);
    });

    it('should reject invalid email', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/auth/contractor/signup')
        .send({ ...validSignupDto, email: 'invalid-email' })
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.message).toContain('email');
    });

    it('should reject weak password', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/auth/contractor/signup')
        .send({ ...validSignupDto, password: 'weak' })
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.message).toBeDefined();
    });

    it('should reject empty specialties', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/auth/contractor/signup')
        .send({ ...validSignupDto, specialties: [] })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should reject invalid hourly rate', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/auth/contractor/signup')
        .send({ ...validSignupDto, hourlyRate: 0 })
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('POST /v1/auth/contractor/verify', () => {
    it('should verify OTP and return tokens', async () => {
      jest.spyOn(contractorAuthService, 'verifyEmailAndInitiateBackgroundCheck').mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: 900,
        tokenType: 'Bearer',
        contractor: {
          id: 'contractor-123',
          businessName: 'Test LLC',
          status: ContractorStatus.BACKGROUND_CHECK_REQUESTED,
          backgroundCheckStatus: BackgroundCheckStatus.REQUESTED,
          verified: false
        }
      });

      const response = await request(app.getHttpServer())
        .post('/v1/auth/contractor/verify')
        .send({ temporaryToken: 'temp-token', otp: '123456' })
        .expect(HttpStatus.OK);

      expect(response.body.accessToken).toBe('access-token');
      expect(response.body.contractor.backgroundCheckStatus).toBe(BackgroundCheckStatus.REQUESTED);
    });

    it('should reject invalid OTP format', async () => {
      await request(app.getHttpServer())
        .post('/v1/auth/contractor/verify')
        .send({ temporaryToken: 'temp-token', otp: 'abc' })
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('POST /v1/auth/contractor/login', () => {
    it('should login contractor successfully', async () => {
      jest.spyOn(contractorAuthService, 'login').mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: 900,
        tokenType: 'Bearer',
        contractor: {
          id: 'contractor-123',
          businessName: 'Test LLC',
          status: ContractorStatus.VERIFIED,
          backgroundCheckStatus: BackgroundCheckStatus.PASSED,
          verified: true
        }
      });

      const response = await request(app.getHttpServer())
        .post('/v1/auth/contractor/login')
        .send({ email: 'contractor@test.com', password: 'SecurePassword123!' })
        .expect(HttpStatus.OK);

      expect(response.body.accessToken).toBe('access-token');
      expect(response.body.contractor.verified).toBe(true);
    });

    it('should reject invalid credentials', async () => {
      jest.spyOn(contractorAuthService, 'login').mockRejectedValue(
        new Error('Invalid credentials')
      );

      await request(app.getHttpServer())
        .post('/v1/auth/contractor/login')
        .send({ email: 'contractor@test.com', password: 'WrongPassword123!' })
        .expect(HttpStatus.INTERNAL_SERVER_ERROR);
    });
  });

  describe('POST /v1/auth/contractor/resend-otp', () => {
    it('should resend OTP', async () => {
      jest.spyOn(contractorAuthService, 'resendOtp').mockResolvedValue({
        temporaryToken: 'new-temp-token',
        expiresAt: new Date(Date.now() + 600000)
      });

      const response = await request(app.getHttpServer())
        .post('/v1/auth/contractor/resend-otp')
        .send({ email: 'contractor@test.com' })
        .expect(HttpStatus.OK);

      expect(response.body.temporaryToken).toBe('new-temp-token');
    });
  });

  describe('GET /v1/auth/contractor/profile', () => {
    it('should return 403 without authentication', async () => {
      await request(app.getHttpServer())
        .get('/v1/auth/contractor/profile')
        .expect(HttpStatus.FORBIDDEN);
    });
  });

  describe('PATCH /v1/auth/contractor/profile', () => {
    it('should return 403 without authentication', async () => {
      await request(app.getHttpServer())
        .patch('/v1/auth/contractor/profile')
        .send({ businessName: 'New Name' })
        .expect(HttpStatus.FORBIDDEN);
    });
  });

  describe('DELETE /v1/auth/contractor/account', () => {
    it('should return 403 without authentication', async () => {
      await request(app.getHttpServer())
        .delete('/v1/auth/contractor/account')
        .send({ password: 'SecurePassword123!' })
        .expect(HttpStatus.FORBIDDEN);
    });
  });
});

describe('DTO Validation', () => {
  let app: INestApplication;

  beforeAll(() => {
    process.env.JWT_ACCESS_SECRET = 'test-access-secret-for-integration-tests';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-for-integration-tests';
  });

  beforeEach(async () => {
    const mockRepository = () => ({
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn((data: any) => Promise.resolve(data)),
      create: jest.fn((data: any) => data),
      update: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ max: null })
      }),
      manager: {
        create: jest.fn((data: any) => data),
        save: jest.fn((data: any) => Promise.resolve(data)),
        transaction: jest.fn(async (cb: any) => cb({ create: (d: any) => d, save: async (d: any) => d }))
      }
    });

    const mockQueryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        create: jest.fn((entity: any, data: any) => ({ ...data, id: 'mock-id' })),
        save: jest.fn((data: any) => Promise.resolve({ ...data, id: data.id || 'mock-id' }))
      }
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [JwtModule.register({ secret: 'test' })],
      controllers: [AuthController],
      providers: [
        AuthService,
        ContractorAuthService,
        PasswordService,
        TokenService,
        { provide: getRepositoryToken(User), useFactory: mockRepository },
        { provide: getRepositoryToken(Contractor), useFactory: mockRepository },
        { provide: getRepositoryToken(Organization), useFactory: mockRepository },
        { provide: getRepositoryToken(Role), useFactory: mockRepository },
        { provide: getRepositoryToken(Otp), useFactory: mockRepository },
        { provide: getRepositoryToken(RefreshToken), useFactory: mockRepository },
        { provide: getRepositoryToken(AuditLog), useFactory: mockRepository },
        { provide: getRepositoryToken(TenantInvite), useFactory: mockRepository },
        {
          provide: getDataSourceToken(),
          useValue: {
            createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
            query: jest.fn()
          }
        }
      ]
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('ContractorSignupDto Validation', () => {
    const validDto = {
      email: 'test@example.com',
      password: 'SecurePassword123!',
      businessName: 'Test Business',
      specialties: ['plumbing'],
      hourlyRate: 50,
      bankAccount: '12345678'
    };

    it('should accept valid DTO', async () => {
      await request(app.getHttpServer())
        .post('/v1/auth/contractor/signup')
        .send(validDto)
        .expect((res) => {
          // Should not be 400 (validation error)
          expect(res.status).not.toBe(HttpStatus.BAD_REQUEST);
        });
    });

    it('should reject missing email', async () => {
      const { email, ...dto } = validDto;
      const response = await request(app.getHttpServer())
        .post('/v1/auth/contractor/signup')
        .send(dto)
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.message).toBeDefined();
    });

    it('should reject missing password', async () => {
      const { password, ...dto } = validDto;
      await request(app.getHttpServer())
        .post('/v1/auth/contractor/signup')
        .send(dto)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should reject missing businessName', async () => {
      const { businessName, ...dto } = validDto;
      await request(app.getHttpServer())
        .post('/v1/auth/contractor/signup')
        .send(dto)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should reject missing specialties', async () => {
      const { specialties, ...dto } = validDto;
      await request(app.getHttpServer())
        .post('/v1/auth/contractor/signup')
        .send(dto)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should reject missing hourlyRate', async () => {
      const { hourlyRate, ...dto } = validDto;
      await request(app.getHttpServer())
        .post('/v1/auth/contractor/signup')
        .send(dto)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should reject missing bankAccount', async () => {
      const { bankAccount, ...dto } = validDto;
      await request(app.getHttpServer())
        .post('/v1/auth/contractor/signup')
        .send(dto)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should reject password without uppercase', async () => {
      await request(app.getHttpServer())
        .post('/v1/auth/contractor/signup')
        .send({ ...validDto, password: 'securepassword123!' })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should reject password without lowercase', async () => {
      await request(app.getHttpServer())
        .post('/v1/auth/contractor/signup')
        .send({ ...validDto, password: 'SECUREPASSWORD123!' })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should reject password without number', async () => {
      await request(app.getHttpServer())
        .post('/v1/auth/contractor/signup')
        .send({ ...validDto, password: 'SecurePassword!!!!' })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should reject password without special character', async () => {
      await request(app.getHttpServer())
        .post('/v1/auth/contractor/signup')
        .send({ ...validDto, password: 'SecurePassword1234' })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should reject short business name', async () => {
      await request(app.getHttpServer())
        .post('/v1/auth/contractor/signup')
        .send({ ...validDto, businessName: 'A' })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should reject zero hourly rate', async () => {
      await request(app.getHttpServer())
        .post('/v1/auth/contractor/signup')
        .send({ ...validDto, hourlyRate: 0 })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should reject short bank account', async () => {
      await request(app.getHttpServer())
        .post('/v1/auth/contractor/signup')
        .send({ ...validDto, bankAccount: '123' })
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('ContractorVerifyOtpDto Validation', () => {
    it('should accept valid OTP format', async () => {
      await request(app.getHttpServer())
        .post('/v1/auth/contractor/verify')
        .send({ temporaryToken: 'valid-token', otp: '123456' })
        .expect((res) => {
          expect(res.status).not.toBe(HttpStatus.BAD_REQUEST);
        });
    });

    it('should reject invalid OTP format (not 6 digits)', async () => {
      await request(app.getHttpServer())
        .post('/v1/auth/contractor/verify')
        .send({ temporaryToken: 'valid-token', otp: '12345' })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should reject alphabetic OTP', async () => {
      await request(app.getHttpServer())
        .post('/v1/auth/contractor/verify')
        .send({ temporaryToken: 'valid-token', otp: 'abcdef' })
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('ContractorLoginDto Validation', () => {
    it('should accept valid login DTO', async () => {
      await request(app.getHttpServer())
        .post('/v1/auth/contractor/login')
        .send({ email: 'test@example.com', password: 'SecurePassword123!' })
        .expect((res) => {
          expect(res.status).not.toBe(HttpStatus.BAD_REQUEST);
        });
    });

    it('should reject invalid email', async () => {
      await request(app.getHttpServer())
        .post('/v1/auth/contractor/login')
        .send({ email: 'invalid', password: 'SecurePassword123!' })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should reject short password', async () => {
      await request(app.getHttpServer())
        .post('/v1/auth/contractor/login')
        .send({ email: 'test@example.com', password: 'short' })
        .expect(HttpStatus.BAD_REQUEST);
    });
  });
});
