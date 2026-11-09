import { Module } from '@nestjs/common';
import { ID_GENERATOR, IdGenerator } from '../../shared/domain/id-generator';
import { UuidIdGenerator } from '../../shared/infrastructure/uuid-id-generator';
import {
  TEMA_REPOSITORY,
  TemaRepository,
} from './domain/repositories/tema.repository';
import {
  LIBRO_REPOSITORY,
  LibroRepository,
} from './domain/repositories/libro.repository';
import {
  AUTOR_REPOSITORY,
  AutorRepository,
} from './domain/repositories/autor.repository';
import { CrearTemaUseCase } from './application/use-cases/crear-tema.use-case';
import { ActualizarLibroUseCase } from './application/use-cases/actualizar-libro.use-case';
import { CrearLibroUseCase } from './application/use-cases/crear-libro.use-case';
import { EliminarLibroUseCase } from './application/use-cases/eliminar-libro.use-case';
import { ListarLibrosUseCase } from './application/use-cases/listar-libros.use-case';
import { ObtenerLibroUseCase } from './application/use-cases/obtener-libro.use-case';
import { ActualizarAutorUseCase } from './application/use-cases/actualizar-autor.use-case';
import { CrearAutorUseCase } from './application/use-cases/crear-autor.use-case';
import { EliminarAutorUseCase } from './application/use-cases/eliminar-autor.use-case';
import { ListarAutoresUseCase } from './application/use-cases/listar-autores.use-case';
import { ObtenerAutorUseCase } from './application/use-cases/obtener-autor.use-case';
import { PrismaTemaRepository } from './infrastructure/persistence/prisma-tema.repository';
import { PrismaLibroRepository } from './infrastructure/persistence/prisma-libro.repository';
import { PrismaAutorRepository } from './infrastructure/persistence/prisma-autor.repository';
import { LibrosController } from './presentation/controllers/libros.controller';
import { AutoresController } from './presentation/controllers/autores.controller';

/**
 * Composición del módulo: aquí (y solo aquí) se une cada interfaz con su implementación.
 * Los casos de uso no tienen decoradores de Nest; se construyen con useFactory.
 */
@Module({
  controllers: [LibrosController, AutoresController],
  providers: [
    { provide: TEMA_REPOSITORY, useClass: PrismaTemaRepository },
    { provide: LIBRO_REPOSITORY, useClass: PrismaLibroRepository },
    { provide: AUTOR_REPOSITORY, useClass: PrismaAutorRepository },
    { provide: ID_GENERATOR, useClass: UuidIdGenerator },
    {
      provide: CrearTemaUseCase,
      useFactory: (temas: TemaRepository, ids: IdGenerator) =>
        new CrearTemaUseCase(temas, ids),
      inject: [TEMA_REPOSITORY, ID_GENERATOR],
    },
    {
      provide: CrearLibroUseCase,
      useFactory: (libros: LibroRepository, ids: IdGenerator) =>
        new CrearLibroUseCase(libros, ids),
      inject: [LIBRO_REPOSITORY, ID_GENERATOR],
    },
    {
      provide: ObtenerLibroUseCase,
      useFactory: (libros: LibroRepository) => new ObtenerLibroUseCase(libros),
      inject: [LIBRO_REPOSITORY],
    },
    {
      provide: ListarLibrosUseCase,
      useFactory: (libros: LibroRepository) => new ListarLibrosUseCase(libros),
      inject: [LIBRO_REPOSITORY],
    },
    {
      provide: ActualizarLibroUseCase,
      useFactory: (libros: LibroRepository) =>
        new ActualizarLibroUseCase(libros),
      inject: [LIBRO_REPOSITORY],
    },
    {
      provide: EliminarLibroUseCase,
      useFactory: (libros: LibroRepository) => new EliminarLibroUseCase(libros),
      inject: [LIBRO_REPOSITORY],
    },
    {
      provide: CrearAutorUseCase,
      useFactory: (autores: AutorRepository, ids: IdGenerator) =>
        new CrearAutorUseCase(autores, ids),
      inject: [AUTOR_REPOSITORY, ID_GENERATOR],
    },
    {
      provide: ObtenerAutorUseCase,
      useFactory: (autores: AutorRepository) =>
        new ObtenerAutorUseCase(autores),
      inject: [AUTOR_REPOSITORY],
    },
    {
      provide: ListarAutoresUseCase,
      useFactory: (autores: AutorRepository) =>
        new ListarAutoresUseCase(autores),
      inject: [AUTOR_REPOSITORY],
    },
    {
      provide: ActualizarAutorUseCase,
      useFactory: (autores: AutorRepository) =>
        new ActualizarAutorUseCase(autores),
      inject: [AUTOR_REPOSITORY],
    },
    {
      provide: EliminarAutorUseCase,
      useFactory: (autores: AutorRepository) =>
        new EliminarAutorUseCase(autores),
      inject: [AUTOR_REPOSITORY],
    },
  ],
  exports: [CrearTemaUseCase],
})
export class CatalogoModule {}
