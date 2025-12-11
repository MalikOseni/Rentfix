import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken, getDataSourceToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, BadRequestException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { ContractorAuthService, ContractorSignupDto } from '../../src/services/contractor-auth.service';
import { PasswordService } from '../../src/services/password.service';
import { TokenService } from '../../src/services/token.service';
import { User, UserRole } from '../../src/entities/user.entity';
import { Contractor, ContractorStatus, BackgroundCheckStatus } from '../../src/entities/contractor.entity';
import { Organization } from '../../src/entities/organization.entity';
import { Role } from '../../src/entities/role.entity';
import { Otp } from '../../src/entities/otp.entity';
import { RefreshToken } from '../../src/entities/refresh-token.entity';
import { AuditLog } from '../../src/entities/audit-log.entity';

describe('ContractorAuthService', () => {
  let service: ContractorAuthService;
  let userRepository: jest.Mocked<Repository<User>>;
  let contractorRepository: jest.Mocked<Repository<Contractor>>;
  let organizationRepository: jest.Mocked<Repository<Organization>>;
  let roleRepository: jest.Mocked<Repository<Role>>;
  let otpRepository: jest.Mocked<Repository<Otp>>;
  let refreshTokenRepository: jest.Mocked<Repository<RefreshToken>>;
  let auditLogRepository: jest.Mocked<Repository<AuditLog>>;
  let passwordService: PasswordService;
  let tokenService: TokenService;
  let dataSource: jest.Mocked<DataSource>;

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

  beforeAll(() => {
    process.env.JWT_ACCESS_SECRET = 'test-access-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
  });

  beforeEach(async () => {
    const mockRepository = () => ({
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      create: jest.fn((data: any) => data),
      update: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ max: null })
      })
    });

    const mockDataSource = {
      createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner)
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContractorAuthService,
        PasswordService,
        TokenService,
        { provide: JwtService, useValue: new JwtService({ secret: 'test' }) },
        { provide: getRepositoryToken(User), useFactory: mockRepository },
        { provide: getRepositoryToken(Contractor), useFactory: mockRepository },
        { provide: getRepositoryToken(Organization), useFactory: mockRepository },
        { provide: getRepositoryToken(Role), useFactory: mockRepository },
        { provide: getRepositoryToken(Otp), useFactory: mockRepository },
        { provide: getRepositoryToken(RefreshToken), useFactory: mockRepository },
        { provide: getRepositoryToken(AuditLog), useFactory: mockRepository },
        { provide: getDataSourceToken(), useValue: mockDataSource }
      ]
    }).compile();

    service = module.get<ContractorAuthService>(ContractorAuthService);
    userRepository = module.get(getRepositoryToken(User));
    contractorRepository = module.get(getRepositoryToken(Contractor));
    organizationRepository = module.get(getRepositoryToken(Organization));
    roleRepository = module.get(getRepositoryToken(Role));
    otpRepository = module.get(getRepositoryToken(Otp));
    refreshTokenRepository = module.get(getRepositoryToken(RefreshToken));
    auditLogRepository = module.get(getRepositoryToken(AuditLog));
    passwordService = module.get<PasswordService>(PasswordService);
    tokenService = module.get<TokenService>(TokenService);
    dataSource = module.get(getDataSourceToken());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('signup', () => {
    const validSignupDto: ContractorSignupDto = {
      email: 'contractor@test.com',
      password: 'SecurePassword123!',
      businessName: 'Test Plumbing LLC',
      firstName: 'John',
      lastName: 'Doe',
      phone: '+447700900123',
      specialties: ['plumbing', 'hvac'],
      hourlyRate: 50,
      insuranceCertUrl: 'https://example.com/cert.pdf',
      bankAccount: '12345678'
    };

    it('should create a new contractor account successfully', async () => {
      userRepository.findOne.mockResolvedValue(null);
      jest.spyOn(passwordService, 'hash').mockResolvedValue('hashed-password');
      jest.spyOn(tokenService, 'generateTokens').mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: 900,
        tokenType: 'Bearer'
      });

      const result = await service.signup(validSignupDto, '127.0.0.1', 'Chrome/120');

      expect(result.temporaryToken).toBeDefined();
      expect(result.otpExpiresAt).toBeInstanceOf(Date);
      expect(result.contractorId).toBeDefined();
      expect(result.status).toBe(ContractorStatus.PENDING);
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('should throw ConflictException if email already exists', async () => {
      userRepository.findOne.mockResolvedValue({ id: 'existing-user' } as User);

      await expect(service.signup(validSignupDto)).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException for invalid phone number', async () => {
      userRepository.findOne.mockResolvedValue(null);
      const invalidDto = { ...validSignupDto, phone: 'invalid-phone' };

      await expect(service.signup(invalidDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for short business name', async () => {
      userRepository.findOne.mockResolvedValue(null);
      const invalidDto = { ...validSignupDto, businessName: 'A' };

      await expect(service.signup(invalidDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for empty specialties', async () => {
      userRepository.findOne.mockResolvedValue(null);
      const invalidDto = { ...validSignupDto, specialties: [] };

      await expect(service.signup(invalidDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid hourly rate', async () => {
      userRepository.findOne.mockResolvedValue(null);
      const invalidDto = { ...validSignupDto, hourlyRate: 0 };

      await expect(service.signup(invalidDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for short bank account', async () => {
      userRepository.findOne.mockResolvedValue(null);
      const invalidDto = { ...validSignupDto, bankAccount: '123' };

      await expect(service.signup(invalidDto)).rejects.toThrow(BadRequestException);
    });

    it('should rollback transaction on error', async () => {
      userRepository.findOne.mockResolvedValue(null);
      jest.spyOn(passwordService, 'hash').mockResolvedValue('hashed-password');
      mockQueryRunner.manager.save.mockRejectedValueOnce(new Error('DB error'));

      await expect(service.signup(validSignupDto)).rejects.toThrow('DB error');
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should login contractor successfully', async () => {
      const mockUser = Object.assign(new User(), {
        id: 'user-123',
        email: 'contractor@test.com',
        emailNormalized: 'contractor@test.com',
        passwordHash: 'hashed-password',
        role: UserRole.contractor,
        tenantId: 'org-123',
        failedLoginAttempts: 0,
        failedLoginAt: null,
        deletedAt: null
      });

      const mockContractor = Object.assign(new Contractor(), {
        id: 'contractor-123',
        user: mockUser,
        businessName: 'Test LLC',
        status: ContractorStatus.VERIFIED,
        backgroundCheckStatus: BackgroundCheckStatus.PASSED,
        deletedAt: null
      });

      userRepository.findOne.mockResolvedValue(mockUser);
      contractorRepository.findOne.mockResolvedValue(mockContractor);
      jest.spyOn(passwordService, 'verifyHash').mockResolvedValue(true);
      jest.spyOn(tokenService, 'generateTokens').mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: 900,
        tokenType: 'Bearer'
      });

      const result = await service.login('contractor@test.com', 'password', '127.0.0.1');

      expect(result.accessToken).toBe('access-token');
      expect(result.contractor.businessName).toBe('Test LLC');
      expect(result.contractor.verified).toBe(true);
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.login('unknown@test.com', 'password')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      const mockUser = Object.assign(new User(), {
        id: 'user-123',
        failedLoginAttempts: 0,
        deletedAt: null
      });

      userRepository.findOne.mockResolvedValue(mockUser);
      jest.spyOn(passwordService, 'verifyHash').mockResolvedValue(false);

      await expect(service.login('contractor@test.com', 'wrong-password')).rejects.toThrow(UnauthorizedException);
      expect(userRepository.save).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for suspended contractor', async () => {
      const mockUser = Object.assign(new User(), {
        id: 'user-123',
        failedLoginAttempts: 0,
        deletedAt: null
      });

      const mockContractor = Object.assign(new Contractor(), {
        status: ContractorStatus.SUSPENDED,
        deletedAt: null
      });

      userRepository.findOne.mockResolvedValue(mockUser);
      contractorRepository.findOne.mockResolvedValue(mockContractor);
      jest.spyOn(passwordService, 'verifyHash').mockResolvedValue(true);

      await expect(service.login('contractor@test.com', 'password')).rejects.toThrow(UnauthorizedException);
    });

    it('should enforce rate limiting after 5 failed attempts', async () => {
      const mockUser = Object.assign(new User(), {
        id: 'user-123',
        failedLoginAttempts: 5,
        failedLoginAt: new Date(),
        deletedAt: null
      });

      userRepository.findOne.mockResolvedValue(mockUser);

      await expect(service.login('contractor@test.com', 'password')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('verifyEmailAndInitiateBackgroundCheck', () => {
    it('should verify email and start background check', async () => {
      const mockUser = Object.assign(new User(), {
        id: 'user-123',
        emailVerified: false,
        deletedAt: null
      });

      const mockOtp = Object.assign(new Otp(), {
        otpHash: 'otp-hash',
        temporaryTokenHash: 'temp-hash',
        expiresAt: new Date(Date.now() + 600000),
        usedAt: null,
        useCount: 0,
        user: mockUser
      });

      const mockContractor = Object.assign(new Contractor(), {
        id: 'contractor-123',
        user: mockUser,
        businessName: 'Test LLC',
        status: ContractorStatus.PENDING,
        backgroundCheckStatus: BackgroundCheckStatus.NOT_STARTED,
        deletedAt: null
      });

      otpRepository.find.mockResolvedValue([mockOtp]);
      contractorRepository.findOne.mockResolvedValue(mockContractor);
      organizationRepository.findOne.mockResolvedValue({ id: 'org-123' } as Organization);
      jest.spyOn(passwordService, 'verifyHash').mockResolvedValue(true);
      jest.spyOn(tokenService, 'generateTokens').mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: 900,
        tokenType: 'Bearer'
      });

      const result = await service.verifyEmailAndInitiateBackgroundCheck('temp-token', '123456');

      expect(result.contractor.backgroundCheckStatus).toBe(BackgroundCheckStatus.REQUESTED);
      expect(contractorRepository.save).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for invalid OTP', async () => {
      otpRepository.find.mockResolvedValue([]);

      await expect(
        service.verifyEmailAndInitiateBackgroundCheck('invalid-token', '000000')
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for expired OTP', async () => {
      const mockOtp = Object.assign(new Otp(), {
        expiresAt: new Date(Date.now() - 1000),
        usedAt: null,
        user: { deletedAt: null }
      });

      otpRepository.find.mockResolvedValue([mockOtp]);
      jest.spyOn(passwordService, 'verifyHash').mockResolvedValue(true);

      await expect(
        service.verifyEmailAndInitiateBackgroundCheck('temp-token', '123456')
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('updateProfile', () => {
    it('should update contractor profile successfully', async () => {
      const mockUser = Object.assign(new User(), { id: 'user-123' });
      const mockContractor = Object.assign(new Contractor(), {
        id: 'contractor-123',
        user: mockUser,
        businessName: 'Old Name',
        specialties: ['plumbing'],
        hourlyRate: 50,
        deletedAt: null
      });

      contractorRepository.findOne.mockResolvedValue(mockContractor);
      contractorRepository.save.mockResolvedValue({
        ...mockContractor,
        businessName: 'New Name',
        hourlyRate: 75
      } as Contractor);

      const result = await service.updateProfile('user-123', {
        businessName: 'New Name',
        hourlyRate: 75
      });

      expect(result.businessName).toBe('New Name');
    });

    it('should throw NotFoundException for unknown contractor', async () => {
      contractorRepository.findOne.mockResolvedValue(null);

      await expect(service.updateProfile('unknown-user', {})).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for invalid hourly rate', async () => {
      const mockContractor = { id: 'contractor-123', deletedAt: null } as Contractor;
      contractorRepository.findOne.mockResolvedValue(mockContractor);

      await expect(service.updateProfile('user-123', { hourlyRate: 0 })).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteAccount', () => {
    it('should delete contractor account (GDPR)', async () => {
      const mockUser = Object.assign(new User(), {
        id: 'user-123',
        passwordHash: 'hashed-password',
        role: UserRole.contractor,
        deletedAt: null
      });

      userRepository.findOne.mockResolvedValue(mockUser);
      jest.spyOn(passwordService, 'verifyHash').mockResolvedValue(true);

      await service.deleteAccount('user-123', 'password');

      expect(contractorRepository.update).toHaveBeenCalled();
      expect(organizationRepository.update).toHaveBeenCalled();
      expect(refreshTokenRepository.update).toHaveBeenCalled();
      expect(userRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException for unknown user', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.deleteAccount('unknown', 'password')).rejects.toThrow(NotFoundException);
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      const mockUser = { id: 'user-123', deletedAt: null } as User;
      userRepository.findOne.mockResolvedValue(mockUser);
      jest.spyOn(passwordService, 'verifyHash').mockResolvedValue(false);

      await expect(service.deleteAccount('user-123', 'wrong')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('updateBackgroundCheckStatus', () => {
    it('should update background check to passed and verify contractor', async () => {
      const mockUser = Object.assign(new User(), { id: 'user-123' });
      const mockContractor = Object.assign(new Contractor(), {
        id: 'contractor-123',
        user: mockUser,
        status: ContractorStatus.BACKGROUND_CHECK_REQUESTED,
        backgroundCheckStatus: BackgroundCheckStatus.IN_PROGRESS,
        deletedAt: null
      });

      contractorRepository.findOne.mockResolvedValue(mockContractor);
      organizationRepository.findOne.mockResolvedValue({ id: 'org-123' } as Organization);

      await service.updateBackgroundCheckStatus('contractor-123', BackgroundCheckStatus.PASSED);

      expect(contractorRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: ContractorStatus.VERIFIED,
          backgroundCheckStatus: BackgroundCheckStatus.PASSED
        })
      );
    });

    it('should update background check to failed', async () => {
      const mockContractor = Object.assign(new Contractor(), {
        id: 'contractor-123',
        user: { id: 'user-123' },
        status: ContractorStatus.BACKGROUND_CHECK_REQUESTED,
        deletedAt: null
      });

      contractorRepository.findOne.mockResolvedValue(mockContractor);

      await service.updateBackgroundCheckStatus('contractor-123', BackgroundCheckStatus.FAILED);

      expect(contractorRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: ContractorStatus.BACKGROUND_CHECK_FAILED,
          backgroundCheckStatus: BackgroundCheckStatus.FAILED
        })
      );
    });

    it('should throw NotFoundException for unknown contractor', async () => {
      contractorRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateBackgroundCheckStatus('unknown', BackgroundCheckStatus.PASSED)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('resendOtp', () => {
    it('should resend OTP for unverified contractor', async () => {
      const mockUser = Object.assign(new User(), {
        id: 'user-123',
        email: 'contractor@test.com',
        emailVerified: false,
        deletedAt: null
      });

      userRepository.findOne.mockResolvedValue(mockUser);
      jest.spyOn(passwordService, 'hash').mockResolvedValue('new-hash');

      const result = await service.resendOtp('contractor@test.com');

      expect(result.temporaryToken).toBeDefined();
      expect(result.expiresAt).toBeInstanceOf(Date);
      expect(otpRepository.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException for unknown email', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.resendOtp('unknown@test.com')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for already verified email', async () => {
      const mockUser = Object.assign(new User(), {
        emailVerified: true,
        deletedAt: null
      });

      userRepository.findOne.mockResolvedValue(mockUser);

      await expect(service.resendOtp('contractor@test.com')).rejects.toThrow(BadRequestException);
    });
  });

  describe('getProfile', () => {
    it('should return contractor profile', async () => {
      const mockContractor = Object.assign(new Contractor(), {
        id: 'contractor-123',
        businessName: 'Test LLC',
        specialties: ['plumbing'],
        hourlyRate: 50
      });

      contractorRepository.findOne.mockResolvedValue(mockContractor);

      const result = await service.getProfile('user-123');

      expect(result?.businessName).toBe('Test LLC');
    });

    it('should return null for unknown contractor', async () => {
      contractorRepository.findOne.mockResolvedValue(null);

      const result = await service.getProfile('unknown');

      expect(result).toBeNull();
    });
  });
});
