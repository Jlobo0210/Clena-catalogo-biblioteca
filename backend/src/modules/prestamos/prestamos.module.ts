import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ID_GENERATOR, IdGenerator } from '../../shared/domain/id-generator';
import { UuidIdGenerator } from '../../shared/infrastructure/uuid-id-generator';
import {
  POLITICA_PRESTAMOS,
  PoliticaPrestamos,
  politicaDesdeEntorno,
} from './application/politica-prestamos';
import { ListarMisPrestamosUseCase } from './application/use-cases/listar-mis-prestamos.use-case';
import { ListarPrestamosUseCase } from './application/use-cases/listar-prestamos.use-case';
import { ObtenerPrestamoUseCase } from './application/use-cases/obtener-prestamo.use-case';
import { RegistrarDevolucionUseCase } from './application/use-cases/registrar-devolucion.use-case';
import { RegistrarPrestamoUseCase } from './application/use-cases/registrar-prestamo.use-case';
import {
  PRESTAMO_REPOSITORY,
  PrestamoRepository,
} from './domain/repositories/prestamo.repository';
import { PrismaPrestamoRepository } from './infrastructure/persistence/prisma-prestamo.repository';
import { PrestamosController } from './presentation/controllers/prestamos.controller';

/**
 * HU-26: préstamos y devoluciones. Composición del módulo: aquí se une cada puerto
 * con su implementación; los casos de uso se construyen con useFactory.
 */
@Module({
  controllers: [PrestamosController],
  providers: [
    { provide: PRESTAMO_REPOSITORY, useClass: PrismaPrestamoRepository },
    { provide: ID_GENERATOR, useClass: UuidIdGenerator },
    {
      provide: POLITICA_PRESTAMOS,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        politicaDesdeEntorno((clave) => config.get<string>(clave)),
    },
    {
      provide: RegistrarPrestamoUseCase,
      useFactory: (
        prestamos: PrestamoRepository,
        ids: IdGenerator,
        politica: PoliticaPrestamos,
      ) => new RegistrarPrestamoUseCase(prestamos, ids, politica),
      inject: [PRESTAMO_REPOSITORY, ID_GENERATOR, POLITICA_PRESTAMOS],
    },
    {
      provide: RegistrarDevolucionUseCase,
      useFactory: (prestamos: PrestamoRepository) =>
        new RegistrarDevolucionUseCase(prestamos),
      inject: [PRESTAMO_REPOSITORY],
    },
    {
      provide: ListarPrestamosUseCase,
      useFactory: (prestamos: PrestamoRepository) =>
        new ListarPrestamosUseCase(prestamos),
      inject: [PRESTAMO_REPOSITORY],
    },
    {
      provide: ListarMisPrestamosUseCase,
      useFactory: (listar: ListarPrestamosUseCase) =>
        new ListarMisPrestamosUseCase(listar),
      inject: [ListarPrestamosUseCase],
    },
    {
      provide: ObtenerPrestamoUseCase,
      useFactory: (prestamos: PrestamoRepository) =>
        new ObtenerPrestamoUseCase(prestamos),
      inject: [PRESTAMO_REPOSITORY],
    },
  ],
})
export class PrestamosModule {}
