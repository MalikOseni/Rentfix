import { JwtService } from '@nestjs/jwt';
import { TokenService } from '../../src/services/token.service';
import { User, UserRole } from '../../src/entities/user.entity';

describe('TokenService', () => {
  beforeAll(() => {
    process.env.JWT_REFRESH_SECRET = 'test';
    process.env.JWT_ACCESS_SECRET = 'test';
  });

  const jwtService = new JwtService({ secret: 'test', signOptions: { expiresIn: '1h' } });
  const service = new TokenService(jwtService);
  const user = Object.assign(new User(), {
    id: 'user-123',
    email: 'Test@Email.com',
    role: UserRole.agent,
    tenantId: null
  });

  it('embeds token_version and organization claim in refresh token', async () => {
    const tokens = await service.generateTokens(user, 3);
    const payload = jwtService.verify(tokens.refreshToken, { secret: 'test' });
    expect(payload.token_version).toBe(3);
    expect(payload.org_id).toBeNull();
  });

  it('returns expiry in seconds for human durations', () => {
    expect(service.getExpirySeconds('15m')).toBe(900);
    expect(service.getExpirySeconds('2h')).toBe(7200);
  });
});
