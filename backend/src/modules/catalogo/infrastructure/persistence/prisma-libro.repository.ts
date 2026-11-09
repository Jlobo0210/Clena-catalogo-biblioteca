import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ConflictError } from '../../../../shared/domain/domain-error';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { Libro, Referencia } from '../../domain/entities/libro';
import {
  FiltroLibros,
  LibroRepository,
} from '../../domain/repositories/libro.repository';
import { LIBRO_INCLUDE, LibroMapper } from '../mappers/libro.mapper';

@Injectable()
export class PrismaLibroRepository implements LibroRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Guarda el libro y reemplaza sus autores y temas en una sola transacción. */
  async guardar(libro: Libro): Promise<void> {
    const datos = LibroMapper.toPersistence(libro);
    try {
      await this.prisma.$transaction([
        this.prisma.libro.upsert({
          where: { id: libro.id },
          create: datos,
          update: { ...datos, id: undefined },
        }),
        this.prisma.libroAutor.deleteMany({ where: { libroId: libro.id } }),
        this.prisma.libroAutor.createMany({
          data: libro.autores.map((a, i) => ({
            libroId: libro.id,
            autorId: a.id,
            orden: i + 1,
          })),
        }),
        this.prisma.libroTema.deleteMany({ where: { libroId: libro.id } }),
        this.prisma.libroTema.createMany({
          data: libro.temas.map((t) => ({ libroId: libro.id, temaId: t.id })),
        }),
      ]);
    } catch (error) {
      // Dos registros simultáneos con el mismo ISBN: lo detecta el índice único.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictError('Ya existe un libro con ese ISBN');
      }
      throw error;
    }
  }

  async buscarPorId(id: string): Promise<Libro | null> {
    const row = await this.prisma.libro.findUnique({
      where: { id },
      include: LIBRO_INCLUDE,
    });
    return row ? LibroMapper.toDomain(row) : null;
  }

  async buscarPorIsbn(isbn: string): Promise<Libro | null> {
    const row = await this.prisma.libro.findUnique({
      where: { isbn },
      include: LIBRO_INCLUDE,
    });
    return row ? LibroMapper.toDomain(row) : null;
  }

  async listar(f: FiltroLibros): Promise<{ items: Libro[]; total: number }> {
    const where: Prisma.LibroWhereInput = {
      ...(f.texto
        ? { titulo: { contains: f.texto, mode: 'insensitive' } }
        : {}),
      ...(f.idioma ? { idioma: f.idioma } : {}),
      ...(f.tipoMaterial ? { tipoMaterial: f.tipoMaterial } : {}),
      ...(f.formato ? { formato: f.formato } : {}),
      ...(f.autorId ? { autores: { some: { autorId: f.autorId } } } : {}),
      ...(f.temaId ? { temas: { some: { temaId: f.temaId } } } : {}),
      ...(f.anioDesde !== undefined || f.anioHasta !== undefined
        ? { anioPublicacion: { gte: f.anioDesde, lte: f.anioHasta } }
        : {}),
    };
    const orden: Record<
      FiltroLibros['ordenarPor'],
      Prisma.LibroOrderByWithRelationInput
    > = {
      titulo: { titulo: f.direccion },
      anio: { anioPublicacion: { sort: f.direccion, nulls: 'last' } },
      creadoEn: { creadoEn: f.direccion },
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.libro.findMany({
        where,
        include: LIBRO_INCLUDE,
        // El id desempata para que la paginación sea estable.
        orderBy: [orden[f.ordenarPor], { id: 'asc' }],
        skip: (f.pagina - 1) * f.tamano,
        take: f.tamano,
      }),
      this.prisma.libro.count({ where }),
    ]);
    return { items: rows.map((r) => LibroMapper.toDomain(r)), total };
  }

  async eliminar(id: string): Promise<void> {
    // libro_autor, libro_tema y las suscripciones se borran en cascada.
    await this.prisma.libro.delete({ where: { id } });
  }

  contarEjemplares(libroId: string): Promise<number> {
    return this.prisma.ejemplar.count({ where: { libroId } });
  }

  async buscarAutores(ids: string[]): Promise<Referencia[]> {
    if (ids.length === 0) return [];
    const rows = await this.prisma.autor.findMany({
      where: { id: { in: ids } },
      select: { id: true, nombre: true },
    });
    return enOrden(ids, rows);
  }

  async buscarTemas(ids: string[]): Promise<Referencia[]> {
    if (ids.length === 0) return [];
    const rows = await this.prisma.tema.findMany({
      where: { id: { in: ids } },
      select: { id: true, nombre: true },
    });
    return enOrden(ids, rows);
  }
}

/** La base no garantiza el orden de `IN`; se respeta el orden en que se pidieron. */
function enOrden(ids: string[], rows: Referencia[]): Referencia[] {
  const porId = new Map(rows.map((r) => [r.id, r]));
  return ids.flatMap((id) => {
    const r = porId.get(id);
    return r ? [r] : [];
  });
}
