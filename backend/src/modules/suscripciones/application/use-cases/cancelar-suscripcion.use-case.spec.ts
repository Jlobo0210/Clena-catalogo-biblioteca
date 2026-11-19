import {
  ConflictError,
  NotFoundError,
} from '../../../../shared/domain/domain-error';
import { SuscripcionDisponibilidad } from '../../domain/suscripcion-disponibilidad.entity';
import { SuscripcionDisponibilidadRepository } from '../../domain/suscripcion-disponibilidad.repository';
import { CancelarSuscripcionUseCase } from './cancelar-suscripcion.use-case';

const AHORA = new Date('2024-06-01T10:00:00Z');
const USUARIO_ID = 'u-1';

class SuscripcionesEnMemoria implements SuscripcionDisponibilidadRepository {
  readonly store = new Map<string, SuscripcionDisponibilidad>();

  async buscarActiva() {
    return null;
  }
  async buscarActivasPorLibro() {
    return [];
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

describe('CancelarSuscripcionUseCase', () => {
  let repo: SuscripcionesEnMemoria;
  let uc: CancelarSuscripcionUseCase;

  beforeEach(() => {
    repo = new SuscripcionesEnMemoria().conSuscripcion(
      's-1',
      USUARIO_ID,
      'l-1',
    );
    uc = new CancelarSuscripcionUseCase(repo, () => AHORA);
  });

  it('cancela una suscripción activa', async () => {
    await uc.execute('s-1', USUARIO_ID);
    const s = repo.store.get('s-1')!;
    expect(s.canceladaEn).toEqual(AHORA);
    expect(s.activa).toBe(false);
  });

  it('lanza NotFoundError si no existe', async () => {
    await expect(uc.execute('no-existe', USUARIO_ID)).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it('lanza NotFoundError si es de otro usuario', async () => {
    await expect(uc.execute('s-1', 'otro-usuario')).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it('lanza ConflictError si ya fue cancelada', async () => {
    await uc.execute('s-1', USUARIO_ID);
    await expect(uc.execute('s-1', USUARIO_ID)).rejects.toBeInstanceOf(
      ConflictError,
    );
  });
});
