import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ConflictError } from '../../../../shared/domain/domain-error';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { Autor } from '../../domain/entities/autor';
import {
  AutorRepository,
  FiltroAutores,
} from '../../domain/repositories/autor.repository';
import { AutorMapper } from '../mappers/autor.mapper';

@Injectable()
export class PrismaAutorRepository implements AutorRepository {
  constructor(private readonly prisma: PrismaService) {}

  async guardar(autor: Autor): Promise<void> {
    const data = AutorMapper.toPersistence(autor);
    await this.prisma.autor.upsert({
      where: { id: data.id },
      create: data,
      update: { nombre: data.nombre, actualizadoEn: data.actualizadoEn },
    });
  }

  async buscarPorId(id: string): Promise<Autor | null> {
    const row = await this.prisma.autor.findUnique({ where: { id } });
    return row ? AutorMapper.toDomain(row) : null;
  }

  async listar(f: FiltroAutores): Promise<{ items: Autor[]; total: number }> {
    const where: Prisma.AutorWhereInput = f.nombre
      ? { nombre: { contains: f.nombre, mode: 'insensitive' } }
      : {};
    const orden: Record<
      FiltroAutores['ordenarPor'],
      Prisma.AutorOrderByWithRelationInput
    > = {
      nombre: { nombre: f.direccion },
      creadoEn: { creadoEn: f.direccion },
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.autor.findMany({
        where,
        // El id desempata para que la paginación sea estable.
        orderBy: [orden[f.ordenarPor], { id: 'asc' }],
        skip: (f.pagina - 1) * f.tamano,
        take: f.tamano,
      }),
      this.prisma.autor.count({ where }),
    ]);
    return { items: rows.map((r) => AutorMapper.toDomain(r)), total };
  }

  async eliminar(id: string): Promise<void> {
    try {
      await this.prisma.autor.delete({ where: { id } });
    } catch (error) {
      // LibroAutor usa onDelete: Restrict. Si otro proceso asocia un libro
      // entre la verificación y el borrado, la base lo impide.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        (error.code === 'P2003' || error.code === 'P2014')
      ) {
        throw new ConflictError(
          'No se puede eliminar el autor: tiene libros asociados',
        );
      }
      throw error;
    }
  }

  contarLibros(autorId: string): Promise<number> {
    return this.prisma.libroAutor.count({ where: { autorId } });
  }
}
