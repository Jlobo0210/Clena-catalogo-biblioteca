import {
  ConflictError,
  NotFoundError,
} from '../../../../shared/domain/domain-error';
import { IdGenerator } from '../../../../shared/domain/id-generator';
import { Ejemplar } from '../../domain/entities/ejemplar';
import { LibroRepository } from '../../domain/repositories/libro.repository';
import { EjemplarRepository } from '../../domain/repositories/ejemplar.repository';
import { CrearEjemplarInput, EjemplarOutput } from '../dtos/ejemplar.dto';
import { aEjemplarOutput } from './ejemplar-comun';

/** HU-17: el personal registra un ejemplar de un libro con su ubicación física. */
export class CrearEjemplarUseCase {
  constructor(
    private readonly libros: LibroRepository,
    private readonly ejemplares: EjemplarRepository,
    private readonly ids: IdGenerator,
    private readonly reloj: () => Date = () => new Date(),
  ) {}

  async execute(
    libroId: string,
    input: CrearEjemplarInput,
  ): Promise<EjemplarOutput> {
    const libro = await this.libros.buscarPorId(libroId);
    if (!libro) throw new NotFoundError('Libro no encontrado');

    if (!libro.admiteEjemplares) {
      throw new ConflictError(
        'Un libro solo digital no puede tener ejemplares físicos',
      );
    }

    const ubicacion = await this.ejemplares.buscarUbicacionPorId(
      input.ubicacionId,
    );
    if (!ubicacion) throw new NotFoundError('Ubicación no encontrada');

    const duplicado = await this.ejemplares.buscarPorCodigo(
      input.codigoInventario,
    );
    if (duplicado) {
      throw new ConflictError(
        `Ya existe un ejemplar con el código «${input.codigoInventario}»`,
      );
    }

    const ejemplar = Ejemplar.crear(
      this.ids.generate(),
      { libroId, ...input },
      ubicacion,
      this.reloj(),
    );

    await this.ejemplares.guardar(ejemplar);
    return aEjemplarOutput(ejemplar);
  }
}
