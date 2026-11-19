import {
  MensajeCorreo,
  ServicioCorreo,
} from '../../../../shared/domain/correo';
import { SuscripcionDisponibilidad } from '../../domain/suscripcion-disponibilidad.entity';
import { SuscripcionDisponibilidadRepository } from '../../domain/suscripcion-disponibilidad.repository';
import { NotificarSuscriptoresUseCase } from './notificar-suscriptores.use-case';

const AHORA = new Date('2024-06-01T10:00:00Z');
const LIBRO_ID = 'l-1';
const TITULO = 'Cien años de soledad';

class SuscripcionesEnMemoria implements SuscripcionDisponibilidadRepository {
  readonly store = new Map<string, SuscripcionDisponibilidad>();

  async buscarActiva() {
    return null;
  }
  async buscarActivasPorLibro(libroId: string) {
    return [...this.store.values()].filter(
      (s) => s.libroId === libroId && s.activa,
    );
  }
  async buscarPorId(id: string) {
    return this.store.get(id) ?? null;
  }
  async guardar(s: SuscripcionDisponibilidad) {
    this.store.set(s.id, s);
  }
  async actualizar(s: SuscripcionDisponibilidad) {
    this.store.set(s.id, s);
  }

  conSuscripcion(id: string, usuarioId: string, libroId: string): this {
    this.store.set(
      id,
      new SuscripcionDisponibilidad(id, usuarioId, libroId, null, null, AHORA),
    );
    return this;
  }
}

class CorreoFalso implements ServicioCorreo {
  readonly enviados: MensajeCorreo[] = [];
  async enviar(mensaje: MensajeCorreo) {
    this.enviados.push(mensaje);
  }
}

describe('NotificarSuscriptoresUseCase', () => {
  let repo: SuscripcionesEnMemoria;
  let correo: CorreoFalso;
  let uc: NotificarSuscriptoresUseCase;

  const obtenerUsuario = (id: string) =>
    Promise.resolve({ nombre: `Usuario ${id}`, email: `${id}@test.com` });

  beforeEach(() => {
    repo = new SuscripcionesEnMemoria();
    correo = new CorreoFalso();
    uc = new NotificarSuscriptoresUseCase(repo, correo, () => AHORA);
  });

  it('no envía nada si no hay suscriptores', async () => {
    await uc.execute({
      libroId: LIBRO_ID,
      tituloLibro: TITULO,
      obtenerUsuario,
    });
    expect(correo.enviados).toHaveLength(0);
  });

  it('envía correo y marca como notificada', async () => {
    repo.conSuscripcion('s-1', 'u-1', LIBRO_ID);
    await uc.execute({
      libroId: LIBRO_ID,
      tituloLibro: TITULO,
      obtenerUsuario,
    });

    expect(correo.enviados).toHaveLength(1);
    expect(correo.enviados[0].para).toBe('u-1@test.com');
    expect(correo.enviados[0].asunto).toContain(TITULO);

    const s = repo.store.get('s-1')!;
    expect(s.notificadaEn).toEqual(AHORA);
    expect(s.activa).toBe(false);
  });

  it('notifica a todos los suscriptores del libro', async () => {
    repo.conSuscripcion('s-1', 'u-1', LIBRO_ID);
    repo.conSuscripcion('s-2', 'u-2', LIBRO_ID);

    await uc.execute({
      libroId: LIBRO_ID,
      tituloLibro: TITULO,
      obtenerUsuario,
    });
    expect(correo.enviados).toHaveLength(2);
  });

  it('no envía a suscriptores de otro libro', async () => {
    repo.conSuscripcion('s-1', 'u-1', 'otro-libro');

    await uc.execute({
      libroId: LIBRO_ID,
      tituloLibro: TITULO,
      obtenerUsuario,
    });
    expect(correo.enviados).toHaveLength(0);
  });

  it('continúa notificando aunque un envío falle', async () => {
    repo.conSuscripcion('s-1', 'u-1', LIBRO_ID);
    repo.conSuscripcion('s-2', 'u-2', LIBRO_ID);

    // El primer usuario no existe (simula error)
    const obtenerConFallo = (id: string) =>
      id === 'u-1' ? Promise.resolve(null) : obtenerUsuario(id);

    await uc.execute({
      libroId: LIBRO_ID,
      tituloLibro: TITULO,
      obtenerUsuario: obtenerConFallo,
    });
    expect(correo.enviados).toHaveLength(1);
    expect(correo.enviados[0].para).toBe('u-2@test.com');
  });
});
