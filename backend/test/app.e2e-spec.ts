import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('Arranque de la aplicación (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('levanta el módulo raíz con todas las capas conectadas', () => {
    // Las rutas reales (/api/v1, /health, /docs) llegan con HU-09.
    return request(app.getHttpServer()).get('/').expect(404);
  });
});
