import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/app.setup';

interface Libro {
  id: string;
  titulo: string;
}
interface Pagina<T> {
  items: T[];
  total: number;
}

const PASSWORD_SEMILLAS = process.env.SEED_PASSWORD!;
/** Datos únicos por corrida: la prueba se puede repetir sobre la misma base. */
const SUFIJO = Date.now().toString(36);

/**
 * HU-35: explorar una categoría contra PostgreSQL real. Crea una categoría con dos libros
 * (uno con un ejemplar disponible y otro con su único ejemplar en reparación) y comprueba
 * que GET /libros?temaId=… aplica los mismos filtros de la búsqueda. Al final borra lo creado.
 */
describe('Exploración por categorías contra PostgreSQL (integración)', () => {
  let app: INestApplication<App>;
  let personal: Record<string, string>;
  const http = () => request(app.getHttpServer());

  const creados: {
    temaId?: string;
    libros: string[];
    ejemplares: [string, string][];
  } = {
    libros: [],
    ejemplares: [],
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    const res = await http()
      .post('/api/v1/auth/login')
      .send({ email: 'personal@clena.example', password: PASSWORD_SEMILLAS })
      .expect(200);
    personal = {
      Authorization: `Bearer ${(res.body as { accessToken: string }).accessToken}`,
    };
  });

  afterAll(async () => {
    for (const [libroId, ejemplarId] of creados.ejemplares) {
      await http()
        .delete(`/api/v1/libros/${libroId}/ejemplares/${ejemplarId}`)
        .set(personal);
    }
    for (const id of creados.libros) {
      await http().delete(`/api/v1/libros/${id}`).set(personal);
    }
    if (creados.temaId) {
      await http().delete(`/api/v1/temas/${creados.temaId}`).set(personal);
    }
    await app.close();
  });

  async function crearLibro(
    titulo: string,
    idioma: string,
    anio: number,
    estado: string,
  ) {
    // Un libro necesita al menos un autor: se usa uno de las semillas.
    const autores = (
      await http().get('/api/v1/autores').query({ tamano: 1 }).expect(200)
    ).body as Pagina<{ id: string }>;
    const libro = (
      await http()
        .post('/api/v1/libros')
        .set(personal)
        .send({
          titulo,
          idioma,
          anioPublicacion: anio,
          autorIds: [autores.items[0].id],
          temaIds: [creados.temaId],
        })
        .expect(201)
    ).body as Libro;
    creados.libros.push(libro.id);

    const ubicaciones = (
      await http().get('/api/v1/ubicaciones').set(personal).expect(200)
    ).body as { id: string }[];
    const ejemplar = (
      await http()
        .post(`/api/v1/libros/${libro.id}/ejemplares`)
        .set(personal)
        .send({
          ubicacionId: ubicaciones[0].id,
          codigoInventario: `HU35-${SUFIJO}-${creados.libros.length}`,
          estado,
        })
        .expect(201)
    ).body as { id: string };
    creados.ejemplares.push([libro.id, ejemplar.id]);
    return libro;
  }

  const titulos = async (query: Record<string, string | number | boolean>) => {
    const res = await http()
      .get('/api/v1/libros')
      .query({ temaId: creados.temaId!, ...query })
      .expect(200);
    return (res.body as Pagina<Libro>).items.map((l) => l.titulo);
  };

  it('lista los libros de la categoría con los filtros de la búsqueda', async () => {
    const tema = (
      await http()
        .post('/api/v1/temas')
        .set(personal)
        .send({ nombre: `Categoría de prueba ${SUFIJO}` })
        .expect(201)
    ).body as { id: string };
    creados.temaId = tema.id;

    const disponible = `Atlas disponible ${SUFIJO}`;
    const enReparacion = `Bitácora en reparación ${SUFIJO}`;
    await crearLibro(disponible, 'es', 2001, 'DISPONIBLE');
    await crearLibro(enReparacion, 'en', 1999, 'EN_REPARACION');

    // La categoría cuenta sus libros (lo que muestra la página de categorías).
    const consultado = await http().get(`/api/v1/temas/${tema.id}`).expect(200);
    expect(consultado.body).toMatchObject({ totalLibros: 2 });

    expect(await titulos({})).toEqual([disponible, enReparacion]);
    expect(await titulos({ soloDisponibles: true })).toEqual([disponible]);
    expect(await titulos({ soloDisponibles: false })).toEqual([
      disponible,
      enReparacion,
    ]);
    expect(await titulos({ idioma: 'en' })).toEqual([enReparacion]);
    expect(await titulos({ anioHasta: 2000 })).toEqual([enReparacion]);
    expect(await titulos({ ordenarPor: 'anio', direccion: 'asc' })).toEqual([
      enReparacion,
      disponible,
    ]);
    expect(await titulos({ tipoMaterial: 'TESIS' })).toEqual([]);
  });
});
