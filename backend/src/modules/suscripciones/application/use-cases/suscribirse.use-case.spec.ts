import { ConflictError } from '../../../../shared/domain/domain-error';
import { SuscripcionDisponibilidad } from '../../domain/suscripcion-disponibilidad.entity';
import { SuscripcionDisponibilidadRepository } from '../../domain/suscripcion-disponibilidad.repository';
import { SuscribirseUseCase } from './suscribirse.use-case';

const AHORA = new Date('2024-06-01T10:00:00Z');
const USUARIO_ID = 'u-1';
const LIBRO_ID = 'l-1';

class SuscripcionesEnMemoria implements SuscripcionDisponibilidadRepository {
  private readonly store = new Map<string, SuscripcionDisponibilidad>();

  async buscarActiva(usuarioId: string, libroId: string) {
    for (const s of this.store.values()) {
      if (s.usuarioId === usuarioId && s.libroId === libroId && s.activa)
        return s;
    }
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
}

describe('SuscribirseUseCase', () => {
  let repo: SuscripcionesEnMemoria;
  let uc: SuscribirseUseCase;

  beforeEach(() => {
    repo = new SuscripcionesEnMemoria();
    uc = new SuscribirseUseCase(repo, () => AHORA);
  });

  it('crea una suscripción activa', async () => {
    const output = await uc.execute({
      usuarioId: USUARIO_ID,
      libroId: LIBRO_ID,
    });
    expect(output.usuarioId).toBe(USUARIO_ID);
    expect(output.libroId).toBe(LIBRO_ID);
    expect(output.id).toBeTruthy();
  });

  it('lanza ConflictError si ya hay suscripción activa', async () => {
    await uc.execute({ usuarioId: USUARIO_ID, libroId: LIBRO_ID });
    await expect(
      uc.execute({ usuarioId: USUARIO_ID, libroId: LIBRO_ID }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('permite suscribirse a libros distintos', async () => {
    await uc.execute({ usuarioId: USUARIO_ID, libroId: LIBRO_ID });
    await expect(
      uc.execute({ usuarioId: USUARIO_ID, libroId: 'l-2' }),
    ).resolves.toBeTruthy();
  });
});
