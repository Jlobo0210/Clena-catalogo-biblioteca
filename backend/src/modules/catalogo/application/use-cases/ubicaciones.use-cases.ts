import { ConflictError } from '../../../../shared/domain/domain-error';
import {
  Lugar,
  describirLugar,
  validarLugar,
} from '../../domain/entities/ubicacion';
import { UbicacionRepository } from '../../domain/repositories/ubicacion.repository';
import { UbicacionOutput } from '../dtos/ejemplar.dto';

/** HU-25: el panel lista las ubicaciones para elegir dónde queda un ejemplar. */
export class ListarUbicacionesUseCase {
  constructor(private readonly ubicaciones: UbicacionRepository) {}

  async execute(): Promise<UbicacionOutput[]> {
    return (await this.ubicaciones.listar()).map((u) => ({ ...u }));
  }
}

/** HU-25: el personal registra un estante nuevo desde el panel. */
export class CrearUbicacionUseCase {
  constructor(private readonly ubicaciones: UbicacionRepository) {}

  async execute(input: Lugar): Promise<UbicacionOutput> {
    const lugar = validarLugar(input);
    if (await this.ubicaciones.buscarPorLugar(lugar)) {
      throw new ConflictError(
        `La ubicación «${describirLugar(lugar)}» ya existe`,
      );
    }
    return { ...(await this.ubicaciones.crear(lugar)) };
  }
}
