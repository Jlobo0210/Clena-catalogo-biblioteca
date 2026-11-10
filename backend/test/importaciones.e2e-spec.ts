import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { TOKEN_SERVICE } from '../src/modules/auth/domain/services/token-service';
import { IMPORTADOR_CATALOGO } from '../src/modules/catalogo/domain/repositories/importador-catalogo';
import { PrismaService } from '../src/shared/infrastructure/prisma/prisma.service';
import { TokensFalsos } from './fakes/auth.fakes';
import { ImportadorEnMemoria } from './fakes/importacion.fakes';

/** Con TokensFalsos, el token «access.<id>.<rol>» representa una sesión de ese rol. */
const PERSONAL = { Authorization: 'Bearer access.p-1.PERSONAL' };
const PUBLICO = { Authorization: 'Bearer access.u-1.PUBLICO' };

/** HU-19: importación del catálogo desde CSV, con el importador en memoria (sin base de datos). */
describe('Importación CSV (e2e)', () => {
  let app: INestApplication<App>;
  const importador = new ImportadorEnMemoria();

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue({ $queryRaw: jest.fn(), $disconnect: jest.fn() })
      .overrideProvider(IMPORTADOR_CATALOGO)
      .useValue(importador)
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

  it('solo el personal descarga la plantilla y la importa', async () => {
    await http().get('/api/v1/importaciones/plantilla').expect(401);
    await http()
      .get('/api/v1/importaciones/plantilla')
      .set(PUBLICO)
      .expect(403);
    await http()
      .post('/api/v1/importaciones/libros')
      .set(PUBLICO)
      .attach('archivo', Buffer.from('titulo\n'), 'a.csv')
      .expect(403);
  });

  let plantilla: Buffer;

  it('descarga la plantilla como CSV adjunto, con BOM para Excel', async () => {
    const res = await http()
      .get('/api/v1/importaciones/plantilla')
      .set(PERSONAL)
      .buffer(true)
      .parse((r, listo) => {
        const partes: Buffer[] = [];
        r.on('data', (p: Buffer) => partes.push(p));
        r.on('end', () => listo(null, Buffer.concat(partes)));
      })
      .expect(200);
    expect(res.headers['content-type']).toMatch(/^text\/csv/);
    expect(res.headers['content-disposition']).toContain(
      'plantilla-catalogo.csv',
    );
    plantilla = res.body as Buffer;
    expect([...plantilla.subarray(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
    expect(plantilla.toString('utf8')).toContain('titulo,autores,idioma');
  });

  it('importa la plantilla y devuelve el reporte', async () => {
    const res = await http()
      .post('/api/v1/importaciones/libros')
      .set(PERSONAL)
      .attach('archivo', plantilla, 'plantilla-catalogo.csv')
      .expect(200);
    expect(res.body).toMatchObject({
      totalFilas: 2,
      filasImportadas: 2,
      filasConError: 0,
      librosCreados: 2,
      errores: [],
    });
  });

  it('lee archivos de Excel en Windows-1252 con punto y coma', async () => {
    // «Martín Ñúñez» en Windows-1252: í = 0xED, Ñ = 0xD1, ú = 0xFA, ñ = 0xF1.
    const archivo = Buffer.concat([
      Buffer.from('titulo;autores;idioma\r\nLibro de prueba;Mart'),
      Buffer.from([0xed]),
      Buffer.from('n '),
      Buffer.from([0xd1, 0xfa, 0xf1]),
      Buffer.from('ez;es\r\n'),
    ]);
    await http()
      .post('/api/v1/importaciones/libros')
      .set(PERSONAL)
      .attach('archivo', archivo, 'excel.csv')
      .expect(200);
    expect(importador.autores.has('martín ñúñez')).toBe(true);
  });

  it('informa errores por fila sin rechazar el archivo', async () => {
    const res = await http()
      .post('/api/v1/importaciones/libros')
      .set(PERSONAL)
      .attach(
        'archivo',
        Buffer.from('titulo,autores,idioma\nBien,Ana,es\n,Ana,es\n'),
        'datos.csv',
      )
      .expect(200);
    expect(res.body).toMatchObject({
      filasImportadas: 1,
      filasConError: 1,
      errores: [{ fila: 3, errores: ['El título es obligatorio'] }],
    });
  });

  it('rechaza con 400: sin archivo, extensión distinta o sin columnas obligatorias', async () => {
    await http().post('/api/v1/importaciones/libros').set(PERSONAL).expect(400);
    await http()
      .post('/api/v1/importaciones/libros')
      .set(PERSONAL)
      .attach('archivo', Buffer.from('titulo,autores,idioma\n'), 'datos.xlsx')
      .expect(400);
    const res = await http()
      .post('/api/v1/importaciones/libros')
      .set(PERSONAL)
      .attach('archivo', Buffer.from('nombre\nX\n'), 'datos.csv')
      .expect(400);
    expect(res.body).toMatchObject({ error: 'VALIDATION_ERROR' });
  });

  it('rechaza archivos de más de 2 MB', async () => {
    const grande = Buffer.alloc(2 * 1024 * 1024 + 1, 'a');
    const res = await http()
      .post('/api/v1/importaciones/libros')
      .set(PERSONAL)
      .attach('archivo', grande, 'grande.csv');
    expect([400, 413]).toContain(res.status);
  });
});
