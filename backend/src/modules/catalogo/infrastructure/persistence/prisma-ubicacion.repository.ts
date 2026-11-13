import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ConflictError } from '../../../../shared/domain/domain-error';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { UbicacionProps } from '../../domain/entities/ejemplar';
import { Lugar, describirLugar } from '../../domain/entities/ubicacion';
import { UbicacionRepository } from '../../domain/repositories/ubicacion.repository';
import { codigoUbicacionLibre } from './codigo-ubicacion';

const COLUMNAS = {
  id: true,
  sala: true,
  seccion: true,
  estante: true,
  codigo: true,
} satisfies Prisma.UbicacionSelect;

@Injectable()
export class PrismaUbicacionRepository implements UbicacionRepository {
  constructor(private readonly prisma: PrismaService) {}

  listar(): Promise<UbicacionProps[]> {
    return this.prisma.ubicacion.findMany({
      select: COLUMNAS,
      orderBy: [{ sala: 'asc' }, { seccion: 'asc' }, { estante: 'asc' }],
    });
  }

  buscarPorLugar(lugar: Lugar): Promise<UbicacionProps | null> {
    return this.prisma.ubicacion.findUnique({
      where: { sala_seccion_estante: lugar },
      select: COLUMNAS,
    });
  }

  async crear(lugar: Lugar): Promise<UbicacionProps> {
    try {
      return await this.prisma.$transaction(async (tx) =>
        tx.ubicacion.create({
          data: { ...lugar, codigo: await codigoUbicacionLibre(tx, lugar) },
          select: COLUMNAS,
        }),
      );
    } catch (error) {
      // Dos personas creando el mismo estante a la vez: lo detecta el índice único.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictError(
          `La ubicación «${describirLugar(lugar)}» ya existe`,
        );
      }
      throw error;
    }
  }
}
