import { IdGenerator } from '../../../../shared/domain/id-generator';
import { Tema } from '../../domain/entities/tema';
import { TemaRepository } from '../../domain/repositories/tema.repository';
import { CrearTemaInput, TemaOutput } from '../dtos/tema.dto';
import { aTemaOutput, asegurarNombreLibre } from './tema-comun';

/**
 * HU-15: el personal registra un tema nuevo en el catálogo.
 * No importa NestJS ni Prisma: recibe sus dependencias por constructor
 * y el módulo de Nest las inyecta por token (ver catalogo.module.ts).
 */
export class CrearTemaUseCase {
  constructor(
    private readonly temas: TemaRepository,
    private readonly ids: IdGenerator,
    private readonly reloj: () => Date = () => new Date(),
  ) {}

  async execute(input: CrearTemaInput): Promise<TemaOutput> {
    const tema = Tema.crear(
      this.ids.generate(),
      input.nombre,
      this.reloj(),
      input.descripcion ?? null,
    );
    await asegurarNombreLibre(this.temas, tema);
    await this.temas.guardar(tema);
    return aTemaOutput(tema);
  }
}
