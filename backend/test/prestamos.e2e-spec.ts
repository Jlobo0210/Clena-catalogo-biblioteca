import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { TOKEN_SERVICE } from '../src/modules/auth/domain/services/token-service';
import { PRESTAMO_REPOSITORY } from '../src/modules/prestamos/domain/repositories/prestamo.repository';
import { PrismaService } from '../src/shared/infrastructure/prisma/prisma.service';
import { TokensFalsos } from './fakes/auth.fakes';
import { PrestamosEnMemoria } from './fakes/prestamos.fakes';

const EJEMPLAR = '11111111-1111-4111-8111-111111111111';
const EN_REPARACION = '22222222-2222-4222-8222-222222222222';
const USUARIO = '33333333-3333-4333-8333-333333333333';
const PERSONAL_ID = '44444444-4444-4444-8444-444444444444';
const NO_EXISTE = '55555555-5555-4555-8555-555555555555';

/** Con TokensFalsos, el token «access.<id>.<rol>» representa una sesión de ese rol. */
const PERSONAL = { Authorization: `Bearer access.${PERSONAL_ID}.PERSONAL` };
const ADMIN = { Authorization: 'Bearer access.a-1.ADMINISTRADOR' };
const PUBLICO = { Authorization: `Bearer access.${USUARIO}.PUBLICO` };

interface PrestamoBody {
  id: string;
  estado: string;
  fechaLimite: string;
  fechaDevolucion: string | null;
  diasRestantes: number | null;
  registradoPor: { id: string; nombre: string };
}

/** HU-26: API de préstamos con repositorio en memoria (sin base de datos). */
describe('Préstamos (e2e)', () => {
  let app: INestApplication<App>;
  const prestamos = new PrestamosEnMemoria()
    .conEjemplar(EJEMPLAR, 'INV-0000-1')
    .conEjemplar(EN_REPARACION, 'INV-0001-1', 'Redes', 'EN_REPARACION')
    .conUsuario(USUARIO, 'Visitante Demo', 'publico@clena.example')
    .conUsuario(PERSONAL_ID, 'Personal Demo', 'personal@clena.example');

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue({ $queryRaw: jest.fn(), $disconnect: jest.fn() })
      .overrideProvider(PRESTAMO_REPOSITORY)
      .useValue(prestamos)
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
  let prestamo: PrestamoBody;

  it('todo exige sesión (401) y rol de personal (403)', async () => {
    await http().get('/api/v1/prestamos').expect(401);
    await http().get('/api/v1/prestamos').set(PUBLICO).expect(403);
    await http()
      .post('/api/v1/prestamos')
      .set(PUBLICO)
      .send({ ejemplarId: EJEMPLAR, usuarioId: USUARIO })
      .expect(403);
  });

  it('valida el cuerpo', async () => {
    for (const cuerpo of [
      {},
      { ejemplarId: 'no-uuid', usuarioId: USUARIO },
      { ejemplarId: EJEMPLAR, usuarioEmail: 'no-es-correo' },
      { ejemplarId: EJEMPLAR },
      {
        ejemplarId: EJEMPLAR,
        codigoInventario: 'INV-0000-1',
        usuarioId: USUARIO,
      },
      { ejemplarId: EJEMPLAR, usuarioId: USUARIO, extra: 1 },
    ]) {
      const res = await http()
        .post('/api/v1/prestamos')
        .set(PERSONAL)
        .send(cuerpo)
        .expect(400);
      expect(res.body).toMatchObject({ error: 'VALIDATION_ERROR' });
    }
  });

  it('el personal presta un ejemplar disponible y queda registrado quién lo hizo', async () => {
    const res = await http()
      .post('/api/v1/prestamos')
      .set(PERSONAL)
      .send({
        codigoInventario: 'INV-0000-1',
        usuarioEmail: 'publico@clena.example',
      })
      .expect(201);
    prestamo = res.body as PrestamoBody;
    expect(prestamo).toMatchObject({
      estado: 'ACTIVO',
      fechaDevolucion: null,
      diasRestantes: 15,
      registradoPor: { id: PERSONAL_ID, nombre: 'Personal Demo' },
    });
    expect(prestamo.fechaLimite).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('no presta lo que no está disponible (409) ni lo que no existe (404)', async () => {
    const prestado = await http()
      .post('/api/v1/prestamos')
      .set(ADMIN)
      .send({ ejemplarId: EJEMPLAR, usuarioId: USUARIO })
      .expect(409);
    expect((prestado.body as { message: string }).message).toContain(
      'ya está prestado',
    );
    await http()
      .post('/api/v1/prestamos')
      .set(PERSONAL)
      .send({ ejemplarId: EN_REPARACION, usuarioId: USUARIO })
      .expect(409);
    await http()
      .post('/api/v1/prestamos')
      .set(PERSONAL)
      .send({ ejemplarId: NO_EXISTE, usuarioId: USUARIO })
      .expect(404);
  });

  it('lista y consulta con filtros', async () => {
    const lista = await http()
      .get('/api/v1/prestamos')
      .set(PERSONAL)
      .query({ estado: 'SIN_DEVOLVER', usuarioId: USUARIO })
      .expect(200);
    expect(lista.body).toMatchObject({
      total: 1,
      items: [{ id: prestamo.id }],
    });

    await http()
      .get('/api/v1/prestamos')
      .set(PERSONAL)
      .query({ estado: 'PERDIDO' })
      .expect(400);
    await http()
      .get(`/api/v1/prestamos/${prestamo.id}`)
      .set(PERSONAL)
      .expect(200);
    await http()
      .get(`/api/v1/prestamos/${NO_EXISTE}`)
      .set(PERSONAL)
      .expect(404);
    await http().get('/api/v1/prestamos/no-uuid').set(PERSONAL).expect(400);
  });

  it('HU-36: seguimiento de vencidos y próximos a vencer', async () => {
    await http().get('/api/v1/prestamos/resumen').set(PUBLICO).expect(403);
    const resumen = await http()
      .get('/api/v1/prestamos/resumen')
      .set(PERSONAL)
      .query({ diasAviso: 30 })
      .expect(200);
    expect(resumen.body).toMatchObject({
      diasAviso: 30,
      sinDevolver: 1,
      vencidos: 0,
      porVencer: 1,
    });

    const porVencer = await http()
      .get('/api/v1/prestamos')
      .set(ADMIN)
      .query({ estado: 'POR_VENCER', diasAviso: 30 })
      .expect(200);
    expect(porVencer.body).toMatchObject({
      total: 1,
      items: [{ id: prestamo.id, diasRetraso: 0 }],
    });

    await http()
      .get('/api/v1/prestamos')
      .set(PERSONAL)
      .query({ limiteDesde: '2026-02-30' })
      .expect(400);
    await http()
      .get('/api/v1/prestamos')
      .set(PERSONAL)
      .query({ limiteDesde: '30/11/2026' })
      .expect(400);
    const alReves = await http()
      .get('/api/v1/prestamos')
      .set(PERSONAL)
      .query({ limiteDesde: '2026-12-01', limiteHasta: '2026-11-01' })
      .expect(400);
    expect(JSON.stringify(alReves.body)).toContain('posterior');
    await http()
      .get('/api/v1/prestamos/resumen')
      .set(PERSONAL)
      .query({ diasAviso: 0 })
      .expect(400);
  });

  it('HU-27: cualquier usuario ve solo sus préstamos en /prestamos/mios', async () => {
    await http().get('/api/v1/prestamos/mios').expect(401);

    const mios = await http()
      .get('/api/v1/prestamos/mios')
      .set(PUBLICO)
      .query({
        estado: 'SIN_DEVOLVER',
        ordenarPor: 'fechaLimite',
        direccion: 'asc',
      })
      .expect(200);
    expect(mios.body).toMatchObject({ total: 1, items: [{ id: prestamo.id }] });

    const ajenos = await http()
      .get('/api/v1/prestamos/mios')
      .set(ADMIN)
      .expect(200);
    expect(ajenos.body).toMatchObject({ total: 0 });

    // No se puede pedir los préstamos de otra persona por parámetro.
    await http()
      .get('/api/v1/prestamos/mios')
      .set(PUBLICO)
      .query({ usuarioId: PERSONAL_ID })
      .expect(400);
  });

  it('registra la devolución una sola vez y el ejemplar queda disponible', async () => {
    const res = await http()
      .post(`/api/v1/prestamos/${prestamo.id}/devolucion`)
      .set(PERSONAL)
      .expect(200);
    expect(res.body).toMatchObject({ estado: 'DEVUELTO', diasRestantes: null });
    expect(prestamos.ejemplares.get(EJEMPLAR)?.estado).toBe('DISPONIBLE');

    await http()
      .post(`/api/v1/prestamos/${prestamo.id}/devolucion`)
      .set(PERSONAL)
      .expect(409);

    const historial = await http()
      .get('/api/v1/prestamos')
      .set(PERSONAL)
      .query({ estado: 'DEVUELTO' })
      .expect(200);
    expect(historial.body).toMatchObject({ total: 1 });
  });
});
