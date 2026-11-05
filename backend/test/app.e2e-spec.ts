import { Body, Controller, Get, INestApplication, Post } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { NotFoundError } from '../src/shared/domain/domain-error';
import { PrismaService } from '../src/shared/infrastructure/prisma/prisma.service';

/** Controlador solo para pruebas: ejercita validación y filtro de errores. */
class EjemploDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  nombre!: string;
}

@Controller('ejemplo')
class EjemploController {
  @Post()
  crear(@Body() dto: EjemploDto) {
    return dto;
  }

  @Get('no-existe')
  noExiste() {
    throw new NotFoundError('Libro no encontrado');
  }

  @Get('explota')
  explota() {
    throw new Error('detalle interno');
  }
}

describe('Base de la API (e2e)', () => {
  let app: INestApplication<App>;
  const prismaFalso = {
    $queryRaw: jest.fn(),
    $disconnect: jest.fn(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
      controllers: [EjemploController],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaFalso)
      .compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/health', () => {
    it('responde 200 cuando la base de datos contesta', async () => {
      prismaFalso.$queryRaw.mockResolvedValueOnce([{ 1: 1 }]);
      const res = await request(app.getHttpServer()).get('/health').expect(200);
      expect(res.body).toMatchObject({
        status: 'ok',
        info: { database: { status: 'up' } },
      });
    });

    it('responde 503 con el formato uniforme si la base de datos cae', async () => {
      prismaFalso.$queryRaw.mockRejectedValueOnce(new Error('ECONNREFUSED'));
      const res = await request(app.getHttpServer()).get('/health').expect(503);
      expect(res.body).toMatchObject({
        statusCode: 503,
        error: 'SERVICE_UNAVAILABLE',
        path: '/health',
      });
    });

    it('no queda bajo /api/v1', () => {
      return request(app.getHttpServer()).get('/api/v1/health').expect(404);
    });
  });

  it('todas las rutas cuelgan de /api/v1', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/ejemplo')
      .send({ nombre: 'ok' })
      .expect(201);
    await request(app.getHttpServer())
      .post('/ejemplo')
      .send({ nombre: 'ok' })
      .expect(404);
  });

  it('expone Swagger en /docs y su JSON con el prefijo', async () => {
    await request(app.getHttpServer()).get('/docs').expect(200);
    const res = await request(app.getHttpServer())
      .get('/docs-json')
      .expect(200);
    const spec = res.body as { paths: Record<string, unknown> };
    expect(Object.keys(spec.paths)).toEqual(
      expect.arrayContaining(['/health', '/api/v1/ejemplo']),
    );
  });

  it('ValidationPipe rechaza datos inválidos con el formato uniforme', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/ejemplo')
      .send({ nombre: '', extra: 'no permitido' })
      .expect(400);
    expect(res.body).toMatchObject({
      statusCode: 400,
      error: 'VALIDATION_ERROR',
      path: '/api/v1/ejemplo',
    });
    const body = res.body as { details: string[]; timestamp: string };
    expect(body.details).toEqual(
      expect.arrayContaining([
        'property extra should not exist',
        'nombre should not be empty',
      ]),
    );
    expect(body.timestamp).toBeDefined();
  });

  it('traduce errores de dominio a HTTP', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/ejemplo/no-existe')
      .expect(404);
    expect(res.body).toMatchObject({
      error: 'NOT_FOUND',
      message: 'Libro no encontrado',
    });
  });

  it('no filtra detalles de errores inesperados y devuelve el id de la petición', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/ejemplo/explota')
      .set('x-request-id', 'prueba-123')
      .expect(500);
    expect(res.body).toMatchObject({
      error: 'INTERNAL_ERROR',
      message: 'Ocurrió un error inesperado',
      requestId: 'prueba-123',
    });
    expect(res.headers['x-request-id']).toBe('prueba-123');
    expect(JSON.stringify(res.body)).not.toContain('detalle interno');
  });

  it('rutas inexistentes también usan el formato uniforme', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/no-hay-nada')
      .expect(404);
    expect(res.body).toMatchObject({ statusCode: 404, error: 'NOT_FOUND' });
  });
});
