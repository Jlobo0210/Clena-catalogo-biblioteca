import {
  ConflictError,
  NotFoundError,
} from '../../../../shared/domain/domain-error';
import { EjemplarRepository } from '../../domain/repositories/ejemplar.repository';
import { ActualizarEjemplarInput, EjemplarOutput } from '../dtos/ejemplar.dto';
import { aEjemplarOutput } from './ejemplar-comun';

export class ActualizarEjemplarUseCase {
  constructor(
    private readonly ejemplares: EjemplarRepository,
    private readonly reloj: () => Date = () => new Date(),
  ) {}

  async execute(
    libroId: string,
    ejemplarId: string,
    input: ActualizarEjemplarInput,
  ): Promise<EjemplarOutput> {
    const ejemplar = await this.ejemplares.buscarPorId(ejemplarId);
    if (!ejemplar || ejemplar.libroId !== libroId) {
      throw new NotFoundError('Ejemplar no encontrado');
    }

    if (input.codigoInventario !== undefined) {
      const dup = await this.ejemplares.buscarPorCodigo(input.codigoInventario);
      if (dup && dup.id !== ejemplarId) {
        throw new ConflictError(
          `Ya existe un ejemplar con el código «${input.codigoInventario}»`,
        );
      }
    }

    const ubicacion = input.ubicacionId
      ? await this.ejemplares.buscarUbicacionPorId(input.ubicacionId)
      : ejemplar.ubicacion;

    if (!ubicacion) throw new NotFoundError('Ubicación no encontrada');

    ejemplar.actualizar(
      {
        ubicacionId: input.ubicacionId,
        codigoInventario: input.codigoInventario,
        estado: input.estado,
        observaciones: input.observaciones,
      },
      ubicacion,
      this.reloj(),
    );

    await this.ejemplares.guardar(ejemplar);
    return aEjemplarOutput(ejemplar);
  }
}
