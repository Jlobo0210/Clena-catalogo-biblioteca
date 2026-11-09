import { Global, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaModule } from '../../shared/infrastructure/prisma/prisma.module';
import { PrismaService } from '../../shared/infrastructure/prisma/prisma.service';
import { TOKEN_SERVICE } from '../auth/domain/services/token-service';
import { CatalogoModule } from './catalogo.module';
import { CrearTemaUseCase } from './application/use-cases/crear-tema.use-case';
import {
  TEMA_REPOSITORY,
  TemaRepository,
} from './domain/repositories/tema.repository';
import {
  LIBRO_REPOSITORY,
  LibroRepository,
} from './domain/repositories/libro.repository';
import { PrismaTemaRepository } from './infrastructure/persistence/prisma-tema.repository';
import { PrismaLibroRepository } from './infrastructure/persistence/prisma-libro.repository';

/** Los guards de @Autenticado necesitan el TokenService, que en la app real exporta AuthModule (global). */
@Global()
@Module({
  providers: [{ provide: TOKEN_SERVICE, useValue: {} }],
  exports: [TOKEN_SERVICE],
})
class TokensDePruebaModule {}

describe('CatalogoModule (inyección por token)', () => {
  it('une cada interfaz de repositorio con su implementación de Prisma', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PrismaModule, TokensDePruebaModule, CatalogoModule],
    })
      .overrideProvider(PrismaService)
      .useValue({})
      .compile();

    expect(moduleRef.get<TemaRepository>(TEMA_REPOSITORY)).toBeInstanceOf(
      PrismaTemaRepository,
    );
    expect(moduleRef.get(CrearTemaUseCase)).toBeInstanceOf(CrearTemaUseCase);
    expect(moduleRef.get<LibroRepository>(LIBRO_REPOSITORY)).toBeInstanceOf(
      PrismaLibroRepository,
    );
  });
});
