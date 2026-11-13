import { ValidationError } from '../../../../shared/domain/domain-error';
import { fechaEnColombia, sumarDias } from '../../domain/fecha-calendario';
import { PrestamoRepository } from '../../domain/repositories/prestamo.repository';
import {
  ListarPrestamosInput,
  Pagina,
  PrestamoOutput,
} from '../dtos/prestamo.dto';
import { aPrestamoOutput } from './prestamo-output';

export const TAMANO_PAGINA_POR_DEFECTO = 20;
export const TAMANO_PAGINA_MAXIMO = 100;
/** HU-36: con esta cantidad de días o menos, un préstamo está «próximo a vencer». */
export const DIAS_AVISO_POR_DEFECTO = 3;
export const DIAS_AVISO_MAXIMO = 30;

export function diasAvisoValido(dias?: number): number {
  if (dias === undefined) return DIAS_AVISO_POR_DEFECTO;
  return Math.min(DIAS_AVISO_MAXIMO, Math.max(1, Math.floor(dias)));
}

const mayor = (a: string | undefined, b: string) => (a && a > b ? a : b);
const menor = (a: string | undefined, b: string) => (a && a < b ? a : b);

/**
 * HU-26: historial de préstamos para el personal, con filtros por estado, usuario y ejemplar.
 * HU-36: también los próximos a vencer (POR_VENCER) y un rango de fecha límite.
 */
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
    if (
      input.limiteDesde &&
      input.limiteHasta &&
      input.limiteDesde > input.limiteHasta
    ) {
      throw new ValidationError(
        'La fecha «desde» no puede ser posterior a la fecha «hasta»',
      );
    }
    const ahora = this.reloj();
    const hoy = fechaEnColombia(ahora);

    // POR_VENCER es SIN_DEVOLVER con la fecha límite entre hoy y hoy + diasAviso.
    const porVencer = input.estado === 'POR_VENCER';
    const estado =
      input.estado === 'POR_VENCER' ? 'SIN_DEVOLVER' : input.estado;
    const { items, total } = await this.prestamos.listar({
      pagina,
      tamano,
      hoy,
      estado,
      usuarioId: input.usuarioId,
      ejemplarId: input.ejemplarId,
      limiteDesde: porVencer
        ? mayor(input.limiteDesde, hoy)
        : input.limiteDesde,
      limiteHasta: porVencer
        ? menor(
            input.limiteHasta,
            sumarDias(hoy, diasAvisoValido(input.diasAviso)),
          )
        : input.limiteHasta,
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
