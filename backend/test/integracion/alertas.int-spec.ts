import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/app.setup';
import {
  fechaEnColombia,
  sumarDias,
} from '../../src/modules/prestamos/domain/fecha-calendario';
import { SERVICIO_CORREO } from '../../src/shared/domain/correo';
import { PrismaService } from '../../src/shared/infrastructure/prisma/prisma.service';
import { CorreoFalso } from '../fakes/alertas.fakes';

interface Pagina<T> {
  items: T[];
}
interface Libro {
  id: string;
  formato: string;
}
interface Ejemplar {
  id: string;
  codigoInventario: string;
  estado: string;
}

const PASSWORD_SEMILLAS = process.env.SEED_PASSWORD!;
const SUFIJO = Date.now().toString(36);

/**
 * HU-29: alertas de devolución contra PostgreSQL real. Solo el servidor de correo es falso,
 * para no enviar correos de verdad; la consulta de pendientes y la regla R14 (índice único
 * de alerta_prestamo) se prueban con la base.
 */
describe('Alertas de devolución contra PostgreSQL (integración)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const correo = new CorreoFalso();
  const http = () => request(app.getHttpServer());

  async function iniciarSesion(email: string, password: string) {
    const res = await http()
      .post('/api/v1/auth/login')
      .send({ email, password })
      .expect(200);
    return {
      Authorization: `Bearer ${(res.body as { accessToken: string }).accessToken}`,
    };
  }

  async function ejemplaresDisponibles(cantidad: number): Promise<Ejemplar[]> {
    const libros = (
      await http().get('/api/v1/libros').query({ tamano: 100 }).expect(200)
    ).body as Pagina<Libro>;
    const encontrados: Ejemplar[] = [];
    for (const libro of libros.items.filter((l) => l.formato !== 'DIGITAL')) {
      const { items } = (
        await http().get(`/api/v1/libros/${libro.id}/ejemplares`).expect(200)
      ).body as { items: Ejemplar[] };
      const disponible = items.find((e) => e.estado === 'DISPONIBLE');
      if (disponible) encontrados.push(disponible);
      if (encontrados.length === cantidad) return encontrados;
    }
    throw new Error('Las semillas no tienen ejemplares disponibles');
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(SERVICIO_CORREO)
      .useValue(correo)
      .compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('envía el recordatorio y el aviso de vencimiento una sola vez, y nada tras la devolución', async () => {
    const email = `alertas-${SUFIJO}@clena.example`;
    await http()
      .post('/api/v1/auth/registro')
      .send({
        nombre: 'Lectora con préstamos',
        email,
        password: 'Lectora12345',
        aceptaAvisoPrivacidad: true,
      })
      .expect(201);
    const personal = await iniciarSesion(
      'personal@clena.example',
      PASSWORD_SEMILLAS,
    );
    const admin = await iniciarSesion('admin@clena.example', PASSWORD_SEMILLAS);

    const prestamoIds: string[] = [];
    for (const ejemplar of await ejemplaresDisponibles(3)) {
      const res = await http()
        .post('/api/v1/prestamos')
        .set(personal)
        .send({
          codigoInventario: ejemplar.codigoInventario,
          usuarioEmail: email,
        })
        .expect(201);
      prestamoIds.push((res.body as { id: string }).id);
    }
    const [porVencer, vencido, devuelto] = prestamoIds;

    // Se mueve la fecha límite en la base: uno vence mañana y dos vencieron hace 4 días.
    const hoy = fechaEnColombia(new Date());
    const fecha = (dias: number) =>
      new Date(`${sumarDias(hoy, dias)}T00:00:00Z`);
    await prisma.prestamo.update({
      where: { id: porVencer },
      data: { fechaLimite: fecha(1) },
    });
    await prisma.prestamo.updateMany({
      where: { id: { in: [vencido, devuelto] } },
      data: { fechaLimite: fecha(-4) },
    });
    // Uno de los vencidos ya se devolvió: no debe recibir aviso.
    await http()
      .post(`/api/v1/prestamos/${devuelto}/devolucion`)
      .set(personal)
      .expect(200);

    const enviar = () =>
      http().post('/api/v1/prestamos/alertas/envios').set(admin).expect(200);
    const primera = (await enviar()).body as { fallidos: number };
    expect(primera.fallidos).toBe(0);

    const recibidos = correo.para(email).map((m) => m.asunto);
    expect(recibidos).toHaveLength(2);
    expect(recibidos[0]).toMatch(
      /^Recordatorio: tu préstamo de «.+» vence mañana$/,
    );
    expect(recibidos[1]).toMatch(/^Tu préstamo de «.+» está vencido$/);
    expect(correo.para(email)[1].texto).toContain('lleva 4 días de retraso');

    const anotadas = await prisma.alertaPrestamo.findMany({
      where: { prestamoId: { in: prestamoIds } },
      orderBy: { tipo: 'asc' },
    });
    expect(anotadas.map((a) => [a.prestamoId, a.tipo])).toEqual([
      [porVencer, 'RECORDATORIO'],
      [vencido, 'VENCIMIENTO'],
    ]);

    // R14: repetir el envío no duplica correos.
    await enviar();
    expect(correo.para(email)).toHaveLength(2);

    // Limpieza: se devuelven los préstamos para no dejar ejemplares prestados.
    for (const id of [porVencer, vencido]) {
      await http()
        .post(`/api/v1/prestamos/${id}/devolucion`)
        .set(personal)
        .expect(200);
    }
  });
});
