import { Test } from '@nestjs/testing';
import { PrismaModule } from '../../shared/infrastructure/prisma/prisma.module';
import { PrismaService } from '../../shared/infrastructure/prisma/prisma.service';
import { CatalogoModule } from './catalogo.module';
import { CrearTemaUseCase } from './application/use-cases/crear-tema.use-case';
import {
  TEMA_REPOSITORY,
  TemaRepository,
} from './domain/repositories/tema.repository';
import { PrismaTemaRepository } from './infrastructure/persistence/prisma-tema.repository';

describe('CatalogoModule (inyección por token)', () => {
  it('une la interfaz TemaRepository con la implementación de Prisma', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PrismaModule, CatalogoModule],
    })
      .overrideProvider(PrismaService)
      .useValue({})
      .compile();

    expect(moduleRef.get<TemaRepository>(TEMA_REPOSITORY)).toBeInstanceOf(
      PrismaTemaRepository,
    );
    expect(moduleRef.get(CrearTemaUseCase)).toBeInstanceOf(CrearTemaUseCase);
  });
});
