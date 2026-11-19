import { NotFoundError } from '../../../../shared/domain/domain-error';
import { NotificarSuscriptoresUseCase } from '../../../suscripciones/application/use-cases/notificar-suscriptores.use-case';
import { PrestamoRepository } from '../../domain/repositories/prestamo.repository';
import { PrestamoOutput } from '../dtos/prestamo.dto';
import { aPrestamoOutput } from './prestamo-output';

/**
 * HU-26: el personal registra la devolución. El ejemplar vuelve a DISPONIBLE
 * y el préstamo queda en el historial con su fecha de devolución.
 * HU-30: tras la devolución notifica a los suscriptores del libro.
 */
export class RegistrarDevolucionUseCase {
  constructor(
    private readonly prestamos: PrestamoRepository,
    private readonly notificar: NotificarSuscriptoresUseCase,
    private readonly reloj: () => Date = () => new Date(),
  ) {}

  async execute(id: string): Promise<PrestamoOutput> {
    const prestamo = await this.prestamos.buscarPorId(id);
    if (!prestamo) {
      throw new NotFoundError('Préstamo no encontrado');
    }

    const ahora = this.reloj();
    prestamo.devolver(ahora);
    await this.prestamos.registrarDevolucion(prestamo);

    const detalle = await this.prestamos.buscarDetalle(id);
    if (!detalle) {
      throw new NotFoundError('Préstamo no encontrado');
    }

    // HU-30: notificar suscriptores en background (no bloquea la devolución)
    void this.notificar
      .execute({
        libroId: detalle.libro.id,
        tituloLibro: detalle.libro.titulo,
        obtenerUsuario: (usuarioId) =>
          this.prestamos
            .buscarUsuario({ id: usuarioId })
            .then((u) =>
              u ? { nombre: u.nombre, email: u.email } : null,
            ),
      })
      .catch(() => {
        // La devolución ya fue registrada; un fallo en las notificaciones no la deshace
      });

    return aPrestamoOutput(detalle, ahora);
  }
}
