import { ConflictError } from '../../../../shared/domain/domain-error';
import { IdGenerator } from '../../../../shared/domain/id-generator';
import { Tema } from '../../domain/entities/tema';
import { TemaRepository } from '../../domain/repositories/tema.repository';
import { CrearTemaInput, TemaOutput } from '../dtos/tema.dto';

/**
 * Caso de uso: registrar un tema nuevo en el catálogo.
 * No importa NestJS ni Prisma: recibe sus dependencias por constructor
 * y el módulo de Nest las inyecta por token (ver catalogo.module.ts).
 */
export class CrearTemaUseCase {
  constructor(
    private readonly temas: TemaRepository,
    private readonly ids: IdGenerator,
  ) {}

  async execute(input: CrearTemaInput): Promise<TemaOutput> {
    const tema = Tema.crear(this.ids.generate(), input.nombre);

    const existente = await this.temas.buscarPorNombre(tema.nombre);
    if (existente) {
      throw new ConflictError(`Ya existe un tema llamado "${tema.nombre}"`);
    }

    await this.temas.guardar(tema);

    return {
      id: tema.id,
      nombre: tema.nombre,
      creadoEn: tema.creadoEn.toISOString(),
    };
  }
}
