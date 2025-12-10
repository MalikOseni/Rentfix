import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AuthModule } from '../../src/modules/auth.module';

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

describe.skip('AuthController (integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AuthModule]
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('exposes health via module bootstrap', async () => {
    await request(app.getHttpServer()).post('/v1/auth/login').send({}).expect(400);
  });
});
