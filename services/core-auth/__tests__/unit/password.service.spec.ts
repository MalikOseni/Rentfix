import { PasswordService } from '../../src/services/password.service';

describe('PasswordService', () => {
  const service = new PasswordService();

  it('hashes with argon2id and verifies successfully', async () => {
    const password = 'Sup3r$ecurePass!';
    const hash = await service.hash(password);

    expect(hash).toContain('argon2id');
    await expect(service.verifyHash(password, hash)).resolves.toBe(true);
    await expect(service.verifyHash('wrong', hash)).resolves.toBe(false);
  });
});
