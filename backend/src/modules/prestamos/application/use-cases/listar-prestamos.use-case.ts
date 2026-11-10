import { fechaEnColombia } from '../../domain/fecha-calendario';
import { PrestamoRepository } from '../../domain/repositories/prestamo.repository';
import {
  ListarPrestamosInput,
  Pagina,
  PrestamoOutput,
} from '../dtos/prestamo.dto';
import { aPrestamoOutput } from './prestamo-output';

export const TAMANO_PAGINA_POR_DEFECTO = 20;
export const TAMANO_PAGINA_MAXIMO = 100;

/** HU-26: historial de préstamos para el personal, con filtros por estado, usuario y ejemplar. */
export class ListarPrestamosUseCase {
  constructor(
    private readonly prestamos: PrestamoRepository,
    private readonly reloj: () => Date = () => new Date(),
  ) {}

  async execute(
    input: ListarPrestamosInput = {},
  ): Promise<Pagina<PrestamoOutput>> {
    const pagina = Math.max(1, Math.floor(input.pagina ?? 1));
    const tamano = Math.min(
      TAMANO_PAGINA_MAXIMO,
      Math.max(1, Math.floor(input.tamano ?? TAMANO_PAGINA_POR_DEFECTO)),
    );
    const ahora = this.reloj();

    const { items, total } = await this.prestamos.listar({
      pagina,
      tamano,
      hoy: fechaEnColombia(ahora),
      estado: input.estado,
      usuarioId: input.usuarioId,
      ejemplarId: input.ejemplarId,
      ordenarPor: input.ordenarPor ?? 'fechaPrestamo',
      direccion: input.direccion ?? 'desc',
    });
    return {
      items: items.map((p) => aPrestamoOutput(p, ahora)),
      total,
      pagina,
      tamano,
    };
  }
}
