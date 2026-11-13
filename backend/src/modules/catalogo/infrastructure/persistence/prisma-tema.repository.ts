import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ConflictError } from '../../../../shared/domain/domain-error';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { Tema } from '../../domain/entities/tema';
import {
  FiltroTemas,
  TemaRepository,
} from '../../domain/repositories/tema.repository';
import { TemaMapper } from '../mappers/tema.mapper';

@Injectable()
export class PrismaTemaRepository implements TemaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async guardar(tema: Tema): Promise<void> {
    const data = TemaMapper.toPersistence(tema);
    try {
      await this.prisma.tema.upsert({
        where: { id: data.id },
        create: data,
        update: {
          nombre: data.nombre,
          slug: data.slug,
          descripcion: data.descripcion,
          actualizadoEn: data.actualizadoEn,
        },
      });
    } catch (error) {
      // nombre y slug son únicos: «Bases de datos» y «Bases-de-datos» generan el mismo slug.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictError(
          `Ya existe un tema con un nombre equivalente a «${tema.nombre}»`,
        );
      }
      throw error;
    }
  }

  async buscarPorId(id: string): Promise<Tema | null> {
    const row = await this.prisma.tema.findUnique({ where: { id } });
    return row ? TemaMapper.toDomain(row) : null;
  }

  async buscarPorNombre(nombre: string): Promise<Tema | null> {
    const row = await this.prisma.tema.findFirst({
      where: { nombre: { equals: nombre, mode: 'insensitive' } },
    });
    return row ? TemaMapper.toDomain(row) : null;
  }

  async listar(f: FiltroTemas): Promise<{ items: Tema[]; total: number }> {
    const where: Prisma.TemaWhereInput = f.nombre
      ? { nombre: { contains: f.nombre, mode: 'insensitive' } }
      : {};
    const orden: Record<
      FiltroTemas['ordenarPor'],
      Prisma.TemaOrderByWithRelationInput
    > = {
      nombre: { nombre: f.direccion },
      creadoEn: { creadoEn: f.direccion },
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.tema.findMany({
        where,
        // El id desempata para que la paginación sea estable.
        orderBy: [orden[f.ordenarPor], { id: 'asc' }],
        skip: (f.pagina - 1) * f.tamano,
        take: f.tamano,
      }),
      this.prisma.tema.count({ where }),
    ]);
    return { items: rows.map((r) => TemaMapper.toDomain(r)), total };
  }

  async eliminar(id: string): Promise<void> {
    await this.prisma.tema.delete({ where: { id } });
  }

  contarLibros(temaId: string): Promise<number> {
    return this.prisma.libroTema.count({ where: { temaId } });
  }

  async contarLibrosPorTema(temaIds: string[]): Promise<Map<string, number>> {
    if (temaIds.length === 0) return new Map();
    const grupos = await this.prisma.libroTema.groupBy({
      by: ['temaId'],
      where: { temaId: { in: temaIds } },
      _count: { _all: true },
    });
    return new Map(grupos.map((g) => [g.temaId, g._count._all]));
  }
}
