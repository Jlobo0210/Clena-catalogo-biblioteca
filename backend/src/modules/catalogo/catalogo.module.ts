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
  EJEMPLAR_REPOSITORY,
  EjemplarRepository,
} from './domain/repositories/ejemplar.repository';
import { CrearTemaUseCase } from './application/use-cases/crear-tema.use-case';
import { ActualizarLibroUseCase } from './application/use-cases/actualizar-libro.use-case';
import { CrearLibroUseCase } from './application/use-cases/crear-libro.use-case';
import { EliminarLibroUseCase } from './application/use-cases/eliminar-libro.use-case';
import { ListarLibrosUseCase } from './application/use-cases/listar-libros.use-case';
import { ObtenerLibroUseCase } from './application/use-cases/obtener-libro.use-case';
import { CrearEjemplarUseCase } from './application/use-cases/crear-ejemplar.use-case';
import { ObtenerEjemplarUseCase } from './application/use-cases/obtener-ejemplar.use-case';
import { ListarEjemplaresUseCase } from './application/use-cases/listar-ejemplares.use-case';
import { ActualizarEjemplarUseCase } from './application/use-cases/actualizar-ejemplar.use-case';
import { EliminarEjemplarUseCase } from './application/use-cases/eliminar-ejemplar.use-case';
import { PrismaTemaRepository } from './infrastructure/persistence/prisma-tema.repository';
import { PrismaLibroRepository } from './infrastructure/persistence/prisma-libro.repository';
import { PrismaEjemplarRepository } from './infrastructure/persistence/prisma-ejemplar.repository';
import { LibrosController } from './presentation/controllers/libros.controller';
import { EjemplaresController } from './presentation/controllers/ejemplares.controller';

/**
 * Composición del módulo: aquí (y solo aquí) se une cada interfaz con su implementación.
 * Los casos de uso no tienen decoradores de Nest; se construyen con useFactory.
 */
@Module({
  controllers: [LibrosController, EjemplaresController],
  providers: [
    { provide: TEMA_REPOSITORY, useClass: PrismaTemaRepository },
    { provide: LIBRO_REPOSITORY, useClass: PrismaLibroRepository },
    { provide: EJEMPLAR_REPOSITORY, useClass: PrismaEjemplarRepository },
    { provide: ID_GENERATOR, useClass: UuidIdGenerator },
    // ── Temas ──
    {
      provide: CrearTemaUseCase,
      useFactory: (temas: TemaRepository, ids: IdGenerator) =>
        new CrearTemaUseCase(temas, ids),
      inject: [TEMA_REPOSITORY, ID_GENERATOR],
    },
    // ── Libros ──
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
    // ── Ejemplares ──
    {
      provide: CrearEjemplarUseCase,
      useFactory: (
        libros: LibroRepository,
        ejemplares: EjemplarRepository,
        ids: IdGenerator,
      ) => new CrearEjemplarUseCase(libros, ejemplares, ids),
      inject: [LIBRO_REPOSITORY, EJEMPLAR_REPOSITORY, ID_GENERATOR],
    },
    {
      provide: ObtenerEjemplarUseCase,
      useFactory: (ejemplares: EjemplarRepository) =>
        new ObtenerEjemplarUseCase(ejemplares),
      inject: [EJEMPLAR_REPOSITORY],
    },
    {
      provide: ListarEjemplaresUseCase,
      useFactory: (libros: LibroRepository, ejemplares: EjemplarRepository) =>
        new ListarEjemplaresUseCase(libros, ejemplares),
      inject: [LIBRO_REPOSITORY, EJEMPLAR_REPOSITORY],
    },
    {
      provide: ActualizarEjemplarUseCase,
      useFactory: (ejemplares: EjemplarRepository) =>
        new ActualizarEjemplarUseCase(ejemplares),
      inject: [EJEMPLAR_REPOSITORY],
    },
    {
      provide: EliminarEjemplarUseCase,
      useFactory: (ejemplares: EjemplarRepository) =>
        new EliminarEjemplarUseCase(ejemplares),
      inject: [EJEMPLAR_REPOSITORY],
    },
  ],
  exports: [CrearTemaUseCase],
})
export class CatalogoModule {}
