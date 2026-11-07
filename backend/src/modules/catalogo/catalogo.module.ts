import { Module } from '@nestjs/common';
import { ID_GENERATOR, IdGenerator } from '../../shared/domain/id-generator';
import { UuidIdGenerator } from '../../shared/infrastructure/uuid-id-generator';
import {
  TEMA_REPOSITORY,
  TemaRepository,
} from './domain/repositories/tema.repository';
import { CrearTemaUseCase } from './application/use-cases/crear-tema.use-case';
import { PrismaTemaRepository } from './infrastructure/persistence/prisma-tema.repository';

/**
 * Composición del módulo: aquí (y solo aquí) se une cada interfaz con su implementación.
 * Los casos de uso no tienen decoradores de Nest; se construyen con useFactory.
 */
@Module({
  providers: [
    { provide: TEMA_REPOSITORY, useClass: PrismaTemaRepository },
    { provide: ID_GENERATOR, useClass: UuidIdGenerator },
    {
      provide: CrearTemaUseCase,
      useFactory: (temas: TemaRepository, ids: IdGenerator) =>
        new CrearTemaUseCase(temas, ids),
      inject: [TEMA_REPOSITORY, ID_GENERATOR],
    },
  ],
  exports: [CrearTemaUseCase],
})
export class CatalogoModule {}
