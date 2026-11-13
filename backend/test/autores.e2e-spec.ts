import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { TOKEN_SERVICE } from '../src/modules/auth/domain/services/token-service';
import { Autor } from '../src/modules/catalogo/domain/entities/autor';
import { AUTOR_REPOSITORY } from '../src/modules/catalogo/domain/repositories/autor.repository';
import { PrismaService } from '../src/shared/infrastructure/prisma/prisma.service';
import { TokensFalsos } from './fakes/auth.fakes';
import { AutoresEnMemoria } from './fakes/catalogo.fakes';

const CON_LIBROS = '11111111-1111-4111-8111-111111111111';
const SIN_LIBROS = '22222222-2222-4222-8222-222222222222';

/** Con TokensFalsos, el token «access.<id>.<rol>» representa una sesión de ese rol. */
const PERSONAL = { Authorization: 'Bearer access.p-1.PERSONAL' };
const PUBLICO = { Authorization: 'Bearer access.u-1.PUBLICO' };

interface AutorBody {
  id: string;
  nombre: string;
  creadoEn: string;
  actualizadoEn: string;
}

/** HU-14: API de autores con repositorio en memoria (sin base de datos). */
describe('Autores (e2e)', () => {
  let app: INestApplication<App>;
  const autores = new AutoresEnMemoria().conLibros(CON_LIBROS, 2);

  beforeAll(async () => {
    await autores.guardar(
      Autor.crear(
        CON_LIBROS,
        'María José Ibáñez',
        new Date('2026-10-01T10:00:00Z'),
      ),
    );
    await autores.guardar(
      Autor.crear(
        SIN_LIBROS,
        'Andrés Núñez Castaño',
        new Date('2026-10-02T10:00:00Z'),
      ),
    );

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue({ $queryRaw: jest.fn(), $disconnect: jest.fn() })
      .overrideProvider(AUTOR_REPOSITORY)
      .useValue(autores)
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
  let creado: AutorBody;

  it('crear exige sesión (401) y rol de personal (403)', async () => {
    await http()
      .post('/api/v1/autores')
      .send({ nombre: 'Gabriel García Márquez' })
      .expect(401);
    await http()
      .post('/api/v1/autores')
      .set(PUBLICO)
      .send({ nombre: 'Gabriel García Márquez' })
      .expect(403);
  });

  it('valida el cuerpo con el formato de error uniforme', async () => {
    const vacio = await http()
      .post('/api/v1/autores')
      .set(PERSONAL)
      .send({})
      .expect(400);
    expect(vacio.body).toMatchObject({ error: 'VALIDATION_ERROR' });

    await http()
      .post('/api/v1/autores')
      .set(PERSONAL)
      .send({ nombre: '   ' })
      .expect(400);
    await http()
      .post('/api/v1/autores')
      .set(PERSONAL)
      .send({ nombre: 'a'.repeat(201) })
      .expect(400);
    await http()
      .post('/api/v1/autores')
      .set(PERSONAL)
      .send({ nombre: 'Gabriel García Márquez', extra: true })
      .expect(400);
  });

  it('el personal registra un autor y normaliza el nombre', async () => {
    const res = await http()
      .post('/api/v1/autores')
      .set(PERSONAL)
      .send({ nombre: '  Gabriel   García Márquez ' })
      .expect(201);

    creado = res.body as AutorBody;
    expect(creado).toMatchObject({ nombre: 'Gabriel García Márquez' });
    expect(typeof creado.id).toBe('string');
    expect(Number.isNaN(Date.parse(creado.creadoEn))).toBe(false);
  });

  it('consultar es público y devuelve 400/404 cuando corresponde', async () => {
    await http().get(`/api/v1/autores/${creado.id}`).expect(200);
    await http().get('/api/v1/autores/no-es-uuid').expect(400);
    await http()
      .get('/api/v1/autores/55555555-5555-4555-8555-555555555555')
      .expect(404);
  });

  it('lista paginado, filtra por nombre y ordena', async () => {
    const pagina = await http()
      .get('/api/v1/autores')
      .query({ tamano: 2 })
      .expect(200);
    expect(pagina.body).toMatchObject({ total: 3, pagina: 1, tamano: 2 });
    expect(
      (pagina.body as { items: AutorBody[] }).items.map((a) => a.nombre),
    ).toEqual(['Andrés Núñez Castaño', 'Gabriel García Márquez']);

    const filtro = await http()
      .get('/api/v1/autores')
      .query({ nombre: 'garcía' })
      .expect(200);
    expect(filtro.body).toMatchObject({
      total: 1,
      items: [{ nombre: 'Gabriel García Márquez' }],
    });

    const descendente = await http()
      .get('/api/v1/autores')
      .query({ ordenarPor: 'nombre', direccion: 'desc', tamano: 2 })
      .expect(200);
    expect(
      (descendente.body as { items: AutorBody[] }).items.map((a) => a.nombre),
    ).toEqual(['María José Ibáñez', 'Gabriel García Márquez']);
  });

  it('rechaza filtros inválidos', async () => {
    await http().get('/api/v1/autores').query({ tamano: 500 }).expect(400);
    await http()
      .get('/api/v1/autores')
      .query({ ordenarPor: 'precio' })
      .expect(400);
    await http()
      .get('/api/v1/autores')
      .query({ direccion: 'arriba' })
      .expect(400);
  });

  it('el personal edita el nombre', async () => {
    const res = await http()
      .patch(`/api/v1/autores/${creado.id}`)
      .set(PERSONAL)
      .send({ nombre: 'Gabriel García Márquez (edición conmemorativa)' })
      .expect(200);
    expect(res.body).toMatchObject({
      id: creado.id,
      nombre: 'Gabriel García Márquez (edición conmemorativa)',
    });

    await http()
      .patch('/api/v1/autores/55555555-5555-4555-8555-555555555555')
      .set(PERSONAL)
      .send({ nombre: 'Nadie' })
      .expect(404);
  });

  it('no elimina un autor con libros (409) y sí uno sin libros (204)', async () => {
    const conflicto = await http()
      .delete(`/api/v1/autores/${CON_LIBROS}`)
      .set(PERSONAL)
      .expect(409);
    expect(conflicto.body).toMatchObject({ error: 'CONFLICT' });
    expect((conflicto.body as { message: string }).message).toContain(
      '2 libro(s) asociado(s)',
    );

    await http()
      .delete(`/api/v1/autores/${creado.id}`)
      .set(PERSONAL)
      .expect(204);
    await http().get(`/api/v1/autores/${creado.id}`).expect(404);
  });
});
