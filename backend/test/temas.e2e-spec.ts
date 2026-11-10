import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { TOKEN_SERVICE } from '../src/modules/auth/domain/services/token-service';
import { Tema } from '../src/modules/catalogo/domain/entities/tema';
import { TEMA_REPOSITORY } from '../src/modules/catalogo/domain/repositories/tema.repository';
import { PrismaService } from '../src/shared/infrastructure/prisma/prisma.service';
import { TokensFalsos } from './fakes/auth.fakes';
import { TemasEnMemoria } from './fakes/catalogo.fakes';

const CON_LIBROS = '11111111-1111-4111-8111-111111111111';
const SIN_LIBROS = '22222222-2222-4222-8222-222222222222';
const NO_EXISTE = '55555555-5555-4555-8555-555555555555';

/** Con TokensFalsos, el token «access.<id>.<rol>» representa una sesión de ese rol. */
const PERSONAL = { Authorization: 'Bearer access.p-1.PERSONAL' };
const ADMIN = { Authorization: 'Bearer access.a-1.ADMINISTRADOR' };
const PUBLICO = { Authorization: 'Bearer access.u-1.PUBLICO' };

interface TemaBody {
  id: string;
  nombre: string;
  descripcion: string | null;
  totalLibros: number;
  creadoEn: string;
  actualizadoEn: string;
}

/** HU-15: API de temas con repositorio en memoria (sin base de datos). */
describe('Temas (e2e)', () => {
  let app: INestApplication<App>;
  const temas = new TemasEnMemoria().conLibros(CON_LIBROS, 5);

  beforeAll(async () => {
    await temas.guardar(
      Tema.crear(CON_LIBROS, 'Literatura', new Date('2026-10-01T10:00:00Z')),
    );
    await temas.guardar(
      Tema.crear(SIN_LIBROS, 'Arquitectura', new Date('2026-10-02T10:00:00Z')),
    );

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue({ $queryRaw: jest.fn(), $disconnect: jest.fn() })
      .overrideProvider(TEMA_REPOSITORY)
      .useValue(temas)
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
  let creado: TemaBody;

  it('crear exige sesión (401) y rol de personal (403)', async () => {
    await http().post('/api/v1/temas').send({ nombre: 'Historia' }).expect(401);
    await http()
      .post('/api/v1/temas')
      .set(PUBLICO)
      .send({ nombre: 'Historia' })
      .expect(403);
  });

  it('valida el cuerpo con el formato de error uniforme', async () => {
    const vacio = await http()
      .post('/api/v1/temas')
      .set(PERSONAL)
      .send({})
      .expect(400);
    expect(vacio.body).toMatchObject({ error: 'VALIDATION_ERROR' });

    for (const cuerpo of [
      { nombre: '   ' },
      { nombre: 'a'.repeat(121) },
      { nombre: 'Historia', descripcion: 'a'.repeat(501) },
      { nombre: 'Historia', descripcion: 42 },
      { nombre: 'Historia', extra: true },
    ]) {
      await http().post('/api/v1/temas').set(PERSONAL).send(cuerpo).expect(400);
    }
  });

  it('el personal registra un tema y normaliza el nombre', async () => {
    const res = await http()
      .post('/api/v1/temas')
      .set(PERSONAL)
      .send({
        nombre: '  Historia   del Caribe ',
        descripcion: 'Barranquilla y la región',
      })
      .expect(201);

    creado = res.body as TemaBody;
    expect(creado).toMatchObject({
      nombre: 'Historia del Caribe',
      descripcion: 'Barranquilla y la región',
      totalLibros: 0,
    });
    expect(Number.isNaN(Date.parse(creado.creadoEn))).toBe(false);
  });

  it('no permite un tema repetido (409)', async () => {
    const res = await http()
      .post('/api/v1/temas')
      .set(ADMIN)
      .send({ nombre: 'literatura' })
      .expect(409);
    expect(res.body).toMatchObject({ error: 'CONFLICT' });
  });

  it('consultar es público, con la cantidad de libros, y devuelve 400/404', async () => {
    const res = await http().get(`/api/v1/temas/${CON_LIBROS}`).expect(200);
    expect(res.body).toMatchObject({ nombre: 'Literatura', totalLibros: 5 });
    await http().get('/api/v1/temas/no-es-uuid').expect(400);
    await http().get(`/api/v1/temas/${NO_EXISTE}`).expect(404);
  });

  it('lista paginado, filtra por nombre y ordena', async () => {
    const pagina = await http()
      .get('/api/v1/temas')
      .query({ tamano: 2 })
      .expect(200);
    expect(pagina.body).toMatchObject({ total: 3, pagina: 1, tamano: 2 });
    expect(
      (pagina.body as { items: TemaBody[] }).items.map((t) => t.nombre),
    ).toEqual(['Arquitectura', 'Historia del Caribe']);

    const filtro = await http()
      .get('/api/v1/temas')
      .query({ nombre: 'LITER' })
      .expect(200);
    expect(filtro.body).toMatchObject({
      total: 1,
      items: [{ nombre: 'Literatura', totalLibros: 5 }],
    });

    const recientes = await http()
      .get('/api/v1/temas')
      .query({ ordenarPor: 'creadoEn', direccion: 'desc', tamano: 1 })
      .expect(200);
    expect(recientes.body).toMatchObject({
      items: [{ nombre: 'Historia del Caribe' }],
    });
  });

  it('rechaza filtros inválidos', async () => {
    await http().get('/api/v1/temas').query({ tamano: 500 }).expect(400);
    await http()
      .get('/api/v1/temas')
      .query({ ordenarPor: 'libros' })
      .expect(400);
    await http()
      .get('/api/v1/temas')
      .query({ direccion: 'arriba' })
      .expect(400);
  });

  it('el personal edita nombre y descripción', async () => {
    const res = await http()
      .patch(`/api/v1/temas/${creado.id}`)
      .set(PERSONAL)
      .send({ nombre: 'Historia regional', descripcion: null })
      .expect(200);
    expect(res.body).toMatchObject({
      id: creado.id,
      nombre: 'Historia regional',
      descripcion: null,
    });

    await http()
      .patch(`/api/v1/temas/${creado.id}`)
      .set(PERSONAL)
      .send({ nombre: 'Arquitectura' })
      .expect(409);
    await http()
      .patch(`/api/v1/temas/${NO_EXISTE}`)
      .set(PERSONAL)
      .send({ nombre: 'Nada' })
      .expect(404);
    await http()
      .patch(`/api/v1/temas/${creado.id}`)
      .set(PUBLICO)
      .send({ nombre: 'Nada' })
      .expect(403);
  });

  it('no elimina un tema con libros (409) y sí uno sin libros (204)', async () => {
    const conflicto = await http()
      .delete(`/api/v1/temas/${CON_LIBROS}`)
      .set(PERSONAL)
      .expect(409);
    expect((conflicto.body as { message: string }).message).toContain(
      '5 libro(s) clasificado(s)',
    );

    await http().delete(`/api/v1/temas/${creado.id}`).expect(401);
    await http().delete(`/api/v1/temas/${creado.id}`).set(PERSONAL).expect(204);
    await http().get(`/api/v1/temas/${creado.id}`).expect(404);
  });
});
