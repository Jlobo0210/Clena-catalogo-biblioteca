import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ConflictError } from '../../../../shared/domain/domain-error';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { Ejemplar, UbicacionProps } from '../../domain/entities/ejemplar';
import { EjemplarRepository } from '../../domain/repositories/ejemplar.repository';
import { EJEMPLAR_INCLUDE, EjemplarMapper } from '../mappers/ejemplar.mapper';

@Injectable()
export class PrismaEjemplarRepository implements EjemplarRepository {
  constructor(private readonly prisma: PrismaService) {}

  async guardar(e: Ejemplar): Promise<void> {
    const datos = EjemplarMapper.toPersistence(e);
    try {
      await this.prisma.ejemplar.upsert({
        where: { id: e.id },
        create: datos,
        update: { ...datos, id: undefined },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictError(
          `Ya existe un ejemplar con el código «${e.codigoInventario}»`,
        );
      }
      throw error;
    }
  }

  async buscarPorId(id: string): Promise<Ejemplar | null> {
    const row = await this.prisma.ejemplar.findUnique({
      where: { id },
      include: EJEMPLAR_INCLUDE,
    });
    return row ? EjemplarMapper.toDomain(row) : null;
  }

  async buscarPorCodigo(codigoInventario: string): Promise<Ejemplar | null> {
    const row = await this.prisma.ejemplar.findUnique({
      where: { codigoInventario },
      include: EJEMPLAR_INCLUDE,
    });
    return row ? EjemplarMapper.toDomain(row) : null;
  }

  async listarPorLibro(libroId: string): Promise<Ejemplar[]> {
    const rows = await this.prisma.ejemplar.findMany({
      where: { libroId },
      include: EJEMPLAR_INCLUDE,
      orderBy: [{ estado: 'asc' }, { codigoInventario: 'asc' }],
    });
    return rows.map((r) => EjemplarMapper.toDomain(r));
  }

  async eliminar(id: string): Promise<void> {
    await this.prisma.ejemplar.delete({ where: { id } });
  }

  contarDisponiblesPorLibro(libroId: string): Promise<number> {
    return this.prisma.ejemplar.count({
      where: { libroId, estado: 'DISPONIBLE' },
    });
  }

  async buscarUbicacionPorId(id: string): Promise<UbicacionProps | null> {
    const row = await this.prisma.ubicacion.findUnique({ where: { id } });
    return row
      ? {
          id: row.id,
          sala: row.sala,
          seccion: row.seccion,
          estante: row.estante,
          codigo: row.codigo,
        }
      : null;
  }

  async listarUbicaciones(): Promise<UbicacionProps[]> {
    const rows = await this.prisma.ubicacion.findMany({
      orderBy: [{ sala: 'asc' }, { seccion: 'asc' }, { estante: 'asc' }],
    });
    return rows.map((r) => ({
      id: r.id,
      sala: r.sala,
      seccion: r.seccion,
      estante: r.estante,
      codigo: r.codigo,
    }));
  }

  async tienePrestamosActivos(ejemplarId: string): Promise<boolean> {
    const count = await this.prisma.prestamo.count({
      where: { ejemplarId, fechaDevolucion: null },
    });
    return count > 0;
  }
}
