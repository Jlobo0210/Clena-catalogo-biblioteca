import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { TOKEN_SERVICE } from '../src/modules/auth/domain/services/token-service';
import { LIBRO_REPOSITORY } from '../src/modules/catalogo/domain/repositories/libro.repository';
import { PrismaService } from '../src/shared/infrastructure/prisma/prisma.service';
import { TokensFalsos } from './fakes/auth.fakes';
import { LibrosEnMemoria } from './fakes/catalogo.fakes';

const AUTOR = '22222222-2222-4222-8222-222222222222';
const TEMA = '33333333-3333-4333-8333-333333333333';

/** Con TokensFalsos, el token «access.<id>.<rol>» representa una sesión de ese rol. */
const PERSONAL = { Authorization: 'Bearer access.p-1.PERSONAL' };
const PUBLICO = { Authorization: 'Bearer access.u-1.PUBLICO' };

interface LibroBody {
  id: string;
  titulo: string;
  isbn: string | null;
  autores: { id: string; nombre: string }[];
}

/** HU-16: API de libros con repositorio en memoria (sin base de datos). */
describe('Libros (e2e)', () => {
  let app: INestApplication<App>;
  const libros = new LibrosEnMemoria()
    .conAutor(AUTOR, 'Gabriel García Márquez')
    .conTema(TEMA, 'Literatura');

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue({ $queryRaw: jest.fn(), $disconnect: jest.fn() })
      .overrideProvider(LIBRO_REPOSITORY)
      .useValue(libros)
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
  const cuerpo = {
    titulo: 'Cien años de soledad',
    idioma: 'es',
    anioPublicacion: 1967,
    isbn: '978-0-306-40615-7',
    autorIds: [AUTOR],
    temaIds: [TEMA],
  };
  let creado: LibroBody;

  it('crear exige sesión (401) y rol de personal (403)', async () => {
    await http().post('/api/v1/libros').send(cuerpo).expect(401);
    await http().post('/api/v1/libros').set(PUBLICO).send(cuerpo).expect(403);
  });

  it('valida el cuerpo con el formato de error uniforme', async () => {
    const res = await http()
      .post('/api/v1/libros')
      .set(PERSONAL)
      .send({ ...cuerpo, autorIds: [], extra: true })
      .expect(400);
    expect(res.body).toMatchObject({ error: 'VALIDATION_ERROR' });
  });

  it('el personal registra un libro', async () => {
    const res = await http()
      .post('/api/v1/libros')
      .set(PERSONAL)
      .send(cuerpo)
      .expect(201);
    creado = res.body as LibroBody;
    expect(creado).toMatchObject({
      titulo: 'Cien años de soledad',
      isbn: '9780306406157',
      autores: [{ id: AUTOR, nombre: 'Gabriel García Márquez' }],
    });
  });

  it('un ISBN repetido devuelve 409', async () => {
    const res = await http()
      .post('/api/v1/libros')
      .set(PERSONAL)
      .send({ ...cuerpo, titulo: 'Otro' })
      .expect(409);
    expect(res.body).toMatchObject({ error: 'CONFLICT' });
  });

  it('un autor inexistente devuelve 400', async () => {
    await http()
      .post('/api/v1/libros')
      .set(PERSONAL)
      .send({
        ...cuerpo,
        isbn: null,
        autorIds: ['44444444-4444-4444-8444-444444444444'],
      })
      .expect(400);
  });

  it('consultar y listar es público, con filtros', async () => {
    await http().get(`/api/v1/libros/${creado.id}`).expect(200);
    const res = await http()
      .get('/api/v1/libros')
      .query({ idioma: 'es', ordenarPor: 'anio', direccion: 'desc' })
      .expect(200);
    expect(res.body).toMatchObject({ total: 1, pagina: 1, tamano: 20 });
  });

  it('rechaza filtros inválidos', async () => {
    await http().get('/api/v1/libros').query({ tamano: 500 }).expect(400);
    await http()
      .get('/api/v1/libros')
      .query({ ordenarPor: 'precio' })
      .expect(400);
    await http().get('/api/v1/libros/no-es-uuid').expect(400);
  });

  it('HU-20: la búsqueda es pública y encuentra por título, autor o tema', async () => {
    const porAutor = await http()
      .get('/api/v1/libros/buscar')
      .query({ q: 'García Márquez' })
      .expect(200);
    expect(porAutor.body).toMatchObject({ total: 1, pagina: 1, tamano: 20 });
    expect((porAutor.body as { items: LibroBody[] }).items[0].id).toBe(
      creado.id,
    );

    const porTema = await http()
      .get('/api/v1/libros/buscar')
      .query({ q: 'literatura' })
      .expect(200);
    expect(porTema.body).toMatchObject({ total: 1 });

    const sinResultados = await http()
      .get('/api/v1/libros/buscar')
      .query({ q: 'astronomía' })
      .expect(200);
    expect(sinResultados.body).toMatchObject({ total: 0, items: [] });
  });

  it('HU-21: encuentra sin tildes y con errores de escritura', async () => {
    for (const q of ['garcia marques', 'cien anos soledad']) {
      const res = await http()
        .get('/api/v1/libros/buscar')
        .query({ q })
        .expect(200);
      expect(res.body).toMatchObject({ total: 1 });
      expect((res.body as { items: LibroBody[] }).items[0].id).toBe(creado.id);
    }
  });

  it('HU-20: valida el texto de búsqueda', async () => {
    await http().get('/api/v1/libros/buscar').expect(400);
    const res = await http()
      .get('/api/v1/libros/buscar')
      .query({ q: 'a' })
      .expect(400);
    expect(res.body).toMatchObject({ error: 'VALIDATION_ERROR' });
  });

  it('devuelve 404 si el libro no existe', async () => {
    await http()
      .get('/api/v1/libros/55555555-5555-4555-8555-555555555555')
      .expect(404);
  });

  it('el personal edita solo los campos enviados', async () => {
    const res = await http()
      .patch(`/api/v1/libros/${creado.id}`)
      .set(PERSONAL)
      .send({ titulo: 'Cien años de soledad (edición conmemorativa)' })
      .expect(200);
    expect(res.body).toMatchObject({
      titulo: 'Cien años de soledad (edición conmemorativa)',
      isbn: '9780306406157',
    });
  });

  it('no elimina un libro con ejemplares (409) y sí uno sin ejemplares (204)', async () => {
    libros.ejemplares.set(creado.id, 1);
    await http()
      .delete(`/api/v1/libros/${creado.id}`)
      .set(PERSONAL)
      .expect(409);

    libros.ejemplares.delete(creado.id);
    await http()
      .delete(`/api/v1/libros/${creado.id}`)
      .set(PERSONAL)
      .expect(204);
    await http().get(`/api/v1/libros/${creado.id}`).expect(404);
  });
});
