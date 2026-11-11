import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/app.setup';

interface Referencia {
  id: string;
  nombre: string;
}
interface Libro {
  id: string;
  titulo: string;
  formato: string;
  autores: Referencia[];
  temas: Referencia[];
}
interface Pagina<T> {
  items: T[];
  total: number;
}
interface Ejemplar {
  id: string;
  codigoInventario: string;
  estado: string;
  ubicacion: { id: string };
}
interface Prestamo {
  id: string;
  estado: string;
  fechaPrestamo: string;
  fechaLimite: string;
  ejemplar: { id: string; codigoInventario: string };
  usuario: { id: string; email: string };
}

const PASSWORD_SEMILLAS = process.env.SEED_PASSWORD!;
/** Datos únicos por corrida: las pruebas se pueden repetir sobre la misma base. */
const SUFIJO = Date.now().toString(36);

/**
 * HU-28: flujos principales de la API contra PostgreSQL real (sin fakes):
 * login, búsqueda con errores de escritura, gestión de libros, préstamo y devolución,
 * e importación CSV. Usa las semillas de HU-10 (50 libros y un usuario por rol).
 */
describe('Flujos principales contra PostgreSQL (integración)', () => {
  let app: INestApplication<App>;
  let personal: Record<string, string>;
  let publico: Record<string, string>;

  const http = () => request(app.getHttpServer());

  async function iniciarSesion(email: string, password: string) {
    const res = await http()
      .post('/api/v1/auth/login')
      .send({ email, password })
      .expect(200);
    const { accessToken } = res.body as { accessToken: string };
    return { Authorization: `Bearer ${accessToken}` };
  }

  async function buscar(q: string) {
    const res = await http()
      .get('/api/v1/libros/buscar')
      .query({ q })
      .expect(200);
    return res.body as Pagina<Libro>;
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();

    personal = await iniciarSesion('personal@clena.example', PASSWORD_SEMILLAS);
    publico = await iniciarSesion('publico@clena.example', PASSWORD_SEMILLAS);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('autenticación', () => {
    it('una clave errada devuelve 401 con el formato de error uniforme', async () => {
      const res = await http()
        .post('/api/v1/auth/login')
        .send({ email: 'personal@clena.example', password: 'clave-errada-1' })
        .expect(401);
      expect(res.body).toMatchObject({ error: 'UNAUTHORIZED' });
    });

    it('un visitante se registra, inicia sesión y no puede gestionar el catálogo', async () => {
      const email = `lector-${SUFIJO}@clena.example`;
      await http()
        .post('/api/v1/auth/registro')
        .send({
          nombre: 'Lector de prueba',
          email,
          password: 'Lector12345',
          aceptaAvisoPrivacidad: true,
        })
        .expect(201);
      const sesion = await iniciarSesion(email, 'Lector12345');
      await http()
        .post('/api/v1/libros')
        .set(sesion)
        .send({ titulo: 'X', idioma: 'es', autorIds: [] })
        .expect(403);
    });

    it('sin sesión no se puede prestar', async () => {
      await http().post('/api/v1/prestamos').send({}).expect(401);
    });
  });

  describe('búsqueda con errores de escritura (HU-20, HU-21)', () => {
    it.each(['garcia marques', 'cien anos soledad', 'GARCÍA MÁRQUEZ'])(
      '«%s» encuentra «Cien años de soledad» primero',
      async (q) => {
        const resultado = await buscar(q);
        expect(resultado.items[0]?.titulo).toBe('Cien años de soledad');
      },
    );

    it('una búsqueda sin coincidencias devuelve una lista vacía', async () => {
      await expect(buscar('astronomia cuantica')).resolves.toMatchObject({
        total: 0,
        items: [],
      });
    });
  });

  describe('gestión de libros (HU-16)', () => {
    it('crea un libro, lo encuentra con un error de escritura, lo edita y lo elimina', async () => {
      const [referencia] = (await buscar('soledad')).items;
      const titulo = `Atlas de prueba ${SUFIJO}`;

      const creado = await http()
        .post('/api/v1/libros')
        .set(personal)
        .send({
          titulo,
          idioma: 'es',
          anioPublicacion: 2024,
          autorIds: [referencia.autores[0].id],
          temaIds: [referencia.temas[0].id],
        })
        .expect(201);
      const libro = creado.body as Libro;
      expect(libro.autores[0].nombre).toBe('Gabriel García Márquez');

      // «atlaz» en vez de «atlas»: lo encuentra la búsqueda tolerante.
      const encontrado = await buscar(`atlaz ${SUFIJO}`);
      expect(encontrado.items.map((l) => l.id)).toContain(libro.id);

      await http()
        .patch(`/api/v1/libros/${libro.id}`)
        .set(personal)
        .send({ titulo: `${titulo} (editado)` })
        .expect(200);
      const consultado = await http()
        .get(`/api/v1/libros/${libro.id}`)
        .expect(200);
      expect((consultado.body as Libro).titulo).toBe(`${titulo} (editado)`);

      await http()
        .delete(`/api/v1/libros/${libro.id}`)
        .set(personal)
        .expect(204);
      await http().get(`/api/v1/libros/${libro.id}`).expect(404);
    });
  });

  describe('préstamo y devolución (HU-26)', () => {
    async function ejemplarDisponible(): Promise<{
      libroId: string;
      ejemplar: Ejemplar;
    }> {
      const libros = (
        await http().get('/api/v1/libros').query({ tamano: 100 }).expect(200)
      ).body as Pagina<Libro>;
      for (const libro of libros.items.filter((l) => l.formato !== 'DIGITAL')) {
        const res = await http()
          .get(`/api/v1/libros/${libro.id}/ejemplares`)
          .expect(200);
        const { items } = res.body as { items: Ejemplar[] };
        const disponible = items.find((e) => e.estado === 'DISPONIBLE');
        if (disponible) return { libroId: libro.id, ejemplar: disponible };
      }
      throw new Error('Las semillas no tienen ejemplares disponibles');
    }

    const estadoDe = async (libroId: string, ejemplarId: string) =>
      (
        (
          await http()
            .get(`/api/v1/libros/${libroId}/ejemplares/${ejemplarId}`)
            .expect(200)
        ).body as Ejemplar
      ).estado;

    it('presta un ejemplar, no deja prestarlo dos veces y registra la devolución', async () => {
      const { libroId, ejemplar } = await ejemplarDisponible();

      const prestado = await http()
        .post('/api/v1/prestamos')
        .set(personal)
        .send({
          codigoInventario: ejemplar.codigoInventario,
          usuarioEmail: 'publico@clena.example',
        })
        .expect(201);
      const prestamo = prestado.body as Prestamo;
      expect(prestamo).toMatchObject({
        estado: 'ACTIVO',
        ejemplar: { id: ejemplar.id },
        usuario: { email: 'publico@clena.example' },
      });
      expect(new Date(prestamo.fechaLimite).getTime()).toBeGreaterThan(
        new Date(prestamo.fechaPrestamo).getTime(),
      );
      expect(await estadoDe(libroId, ejemplar.id)).toBe('PRESTADO');

      // No se presta un ejemplar que no está disponible.
      await http()
        .post('/api/v1/prestamos')
        .set(personal)
        .send({
          codigoInventario: ejemplar.codigoInventario,
          usuarioEmail: 'publico@clena.example',
        })
        .expect(409);
      // Un visitante no puede registrar préstamos.
      await http()
        .post('/api/v1/prestamos')
        .set(publico)
        .send({ codigoInventario: ejemplar.codigoInventario })
        .expect(403);

      const devuelto = await http()
        .post(`/api/v1/prestamos/${prestamo.id}/devolucion`)
        .set(personal)
        .expect(200);
      expect((devuelto.body as Prestamo).estado).toBe('DEVUELTO');
      expect(await estadoDe(libroId, ejemplar.id)).toBe('DISPONIBLE');

      // Una segunda devolución no se acepta, y el préstamo queda en el historial.
      await http()
        .post(`/api/v1/prestamos/${prestamo.id}/devolucion`)
        .set(personal)
        .expect(409);
      const historial = await http()
        .get('/api/v1/prestamos')
        .set(personal)
        .query({ ejemplarId: ejemplar.id })
        .expect(200);
      expect(
        (historial.body as Pagina<Prestamo>).items.map((p) => p.id),
      ).toContain(prestamo.id);
    });
  });

  describe('importación CSV (HU-19)', () => {
    it('importa un archivo y el libro queda disponible en la búsqueda', async () => {
      const titulo = `Libro importado ${SUFIJO}`;
      const csv = `titulo,autores,idioma,temas\n${titulo},Autora Importada ${SUFIJO},es,Historia\n`;

      const res = await http()
        .post('/api/v1/importaciones/libros')
        .set(personal)
        .attach('archivo', Buffer.from(csv), 'catalogo.csv')
        .expect(200);
      expect(res.body).toMatchObject({
        filasImportadas: 1,
        librosCreados: 1,
        autoresCreados: 1,
        temasCreados: 0,
      });

      const [encontrado] = (await buscar(`importado ${SUFIJO}`)).items;
      expect(encontrado).toMatchObject({
        titulo,
        temas: [{ nombre: 'Historia' }],
      });
    });
  });
});
