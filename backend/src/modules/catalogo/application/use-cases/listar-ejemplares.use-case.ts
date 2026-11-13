import { NotFoundError } from '../../../../shared/domain/domain-error';
import { LibroRepository } from '../../domain/repositories/libro.repository';
import { EjemplarRepository } from '../../domain/repositories/ejemplar.repository';
import { DisponibilidadOutput, EjemplarOutput } from '../dtos/ejemplar.dto';
import { aEjemplarOutput } from './ejemplar-comun';

export interface ListarEjemplaresOutput {
  items: EjemplarOutput[];
  disponibilidad: DisponibilidadOutput;
}

/** HU-17: lista los ejemplares de un libro y calcula su disponibilidad. */
export class ListarEjemplaresUseCase {
  constructor(
    private readonly libros: LibroRepository,
    private readonly ejemplares: EjemplarRepository,
  ) {}

  async execute(libroId: string): Promise<ListarEjemplaresOutput> {
    const libro = await this.libros.buscarPorId(libroId);
    if (!libro) throw new NotFoundError('Libro no encontrado');

    const [items, disponibles] = await Promise.all([
      this.ejemplares.listarPorLibro(libroId),
      this.ejemplares.contarDisponiblesPorLibro(libroId),
    ]);

    const proximaDevolucion =
      disponibles === 0
        ? await this.ejemplares.proximaFechaDevolucion(libroId)
        : null;

    return {
      items: items.map(aEjemplarOutput),
      disponibilidad: {
        libroId,
        totalEjemplares: items.length,
        disponibles,
        disponible: disponibles > 0,
        proximaDevolucion: proximaDevolucion
          ? proximaDevolucion.toISOString()
          : null,
      },
    };
  }
}
