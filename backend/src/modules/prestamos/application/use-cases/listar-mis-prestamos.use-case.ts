import {
  ListarPrestamosInput,
  Pagina,
  PrestamoOutput,
} from '../dtos/prestamo.dto';
import { ListarPrestamosUseCase } from './listar-prestamos.use-case';

export type ListarMisPrestamosInput = Omit<
  ListarPrestamosInput,
  'usuarioId' | 'ejemplarId'
>;

/**
 * HU-27: cada usuario consulta solo sus propios préstamos (activos e históricos).
 * El usuario sale del token, nunca de la petición.
 */
export class ListarMisPrestamosUseCase {
  constructor(private readonly listar: ListarPrestamosUseCase) {}

  execute(
    usuarioId: string,
    input: ListarMisPrestamosInput = {},
  ): Promise<Pagina<PrestamoOutput>> {
    return this.listar.execute({
      pagina: input.pagina,
      tamano: input.tamano,
      estado: input.estado,
      ordenarPor: input.ordenarPor,
      direccion: input.direccion,
      usuarioId,
    });
  }
}
