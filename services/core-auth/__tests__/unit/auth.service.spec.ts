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
import { User } from '../../src/entities/user.entity';

describe('AuthService', () => {
  let service: AuthService;
  let userRepo: Repository<User>;

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
        { provide: getRepositoryToken(AuditLog), useClass: Repository }
      ]
    }).compile();

    service = moduleRef.get(AuthService);
    userRepo = moduleRef.get(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(userRepo).toBeDefined();
  });
});
