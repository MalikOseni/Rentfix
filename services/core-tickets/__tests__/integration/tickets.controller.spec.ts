import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { TicketsModule } from '../../src/modules/tickets.module';

describe('TicketsController (integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [TicketsModule]
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects missing payload on create', async () => {
    await request(app.getHttpServer())
      .post('/v1/tickets')
      .set('Authorization', 'Bearer dummy')
      .expect(401);
  });
});
