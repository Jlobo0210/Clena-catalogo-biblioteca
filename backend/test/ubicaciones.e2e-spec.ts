import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { TOKEN_SERVICE } from '../src/modules/auth/domain/services/token-service';
import { UBICACION_REPOSITORY } from '../src/modules/catalogo/domain/repositories/ubicacion.repository';
import { PrismaService } from '../src/shared/infrastructure/prisma/prisma.service';
import { TokensFalsos } from './fakes/auth.fakes';
import { UbicacionesEnMemoria } from './fakes/ubicaciones.fakes';

/** Con TokensFalsos, el token «access.<id>.<rol>» representa una sesión de ese rol. */
const PERSONAL = { Authorization: 'Bearer access.p-1.PERSONAL' };
const PUBLICO = { Authorization: 'Bearer access.u-1.PUBLICO' };

/** HU-25: ubicaciones para el panel, con repositorio en memoria (sin base de datos). */
describe('Ubicaciones (e2e)', () => {
  let app: INestApplication<App>;
  const ubicaciones = new UbicacionesEnMemoria().con({
    sala: 'Sala 1',
    seccion: 'Historia',
    estante: 'H-01',
  });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue({ $queryRaw: jest.fn(), $disconnect: jest.fn() })
      .overrideProvider(UBICACION_REPOSITORY)
      .useValue(ubicaciones)
      .overrideProvider(TOKEN_SERVICE)
      .useValue(new TokensFalsos())
      .compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const http = () => request(app.getHttpServer());
  const nueva = { sala: 'Sala 3', seccion: 'Referencia', estante: 'R-01' };

  it('listar es público', async () => {
    const res = await http().get('/api/v1/ubicaciones').expect(200);
    expect(res.body).toEqual([
      expect.objectContaining({
        sala: 'Sala 1',
        seccion: 'Historia',
        estante: 'H-01',
      }),
    ]);
  });

  it('crear exige sesión (401) y rol de personal (403)', async () => {
    await http().post('/api/v1/ubicaciones').send(nueva).expect(401);
    await http()
      .post('/api/v1/ubicaciones')
      .set(PUBLICO)
      .send(nueva)
      .expect(403);
  });

  it('el personal crea una ubicación y no puede repetirla', async () => {
    const res = await http()
      .post('/api/v1/ubicaciones')
      .set(PERSONAL)
      .send({ ...nueva, sala: '  Sala   3 ' })
      .expect(201);
    expect(res.body).toMatchObject(nueva);

    const repetida = await http()
      .post('/api/v1/ubicaciones')
      .set(PERSONAL)
      .send(nueva)
      .expect(409);
    expect(repetida.body).toMatchObject({ error: 'CONFLICT' });
  });

  it('valida los campos', async () => {
    const res = await http()
      .post('/api/v1/ubicaciones')
      .set(PERSONAL)
      .send({ sala: '', seccion: 'X' })
      .expect(400);
    expect(res.body).toMatchObject({ error: 'VALIDATION_ERROR' });
  });
});
