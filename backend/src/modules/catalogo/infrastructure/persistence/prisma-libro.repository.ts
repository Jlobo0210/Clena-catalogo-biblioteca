import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ConflictError } from '../../../../shared/domain/domain-error';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { Libro, Referencia } from '../../domain/entities/libro';
import {
  ConsultaBusqueda,
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

  /**
   * HU-20: cada término debe aparecer en el título, en algún autor o en algún tema.
   * Relevancia: +3 por término en el título, +2 en un autor, +1 en un tema,
   * +5 si el título contiene la frase completa y +3 más si empieza con ella.
   * Prisma no ordena por una expresión calculada, por eso la consulta es SQL.
   */
  async buscar(
    c: ConsultaBusqueda,
  ): Promise<{ items: Libro[]; total: number }> {
    const terminos = c.terminos.map((t) => `%${escaparLike(t)}%`);
    const frase = escaparLike(c.frase);
    const coincidencias = Prisma.sql`
      WITH documento AS (
        SELECT l.id, l.titulo,
          coalesce((SELECT string_agg(a.nombre, ' ') FROM libro_autor la
                    JOIN autor a ON a.id = la.autor_id WHERE la.libro_id = l.id), '') AS autores,
          coalesce((SELECT string_agg(t.nombre, ' ') FROM libro_tema lt
                    JOIN tema t ON t.id = lt.tema_id WHERE lt.libro_id = l.id), '') AS temas
        FROM libro l
      )
      SELECT d.id, d.titulo,
        (SELECT sum(
             CASE WHEN d.titulo ILIKE p THEN 3 ELSE 0 END
           + CASE WHEN d.autores ILIKE p THEN 2 ELSE 0 END
           + CASE WHEN d.temas ILIKE p THEN 1 ELSE 0 END)
         FROM unnest(${terminos}::text[]) AS p)
        + CASE WHEN d.titulo ILIKE ${`%${frase}%`} THEN 5 ELSE 0 END
        + CASE WHEN d.titulo ILIKE ${`${frase}%`} THEN 3 ELSE 0 END AS relevancia
      FROM documento d
      WHERE NOT EXISTS (
        SELECT 1 FROM unnest(${terminos}::text[]) AS p
        WHERE d.titulo || ' ' || d.autores || ' ' || d.temas NOT ILIKE p
      )`;

    const [pagina, conteo] = await this.prisma.$transaction([
      this.prisma.$queryRaw<{ id: string }[]>`
        SELECT id FROM (${coincidencias}) c
        ORDER BY relevancia DESC, titulo ASC, id ASC
        LIMIT ${c.tamano} OFFSET ${(c.pagina - 1) * c.tamano}`,
      this.prisma.$queryRaw<{ total: number }[]>`
        SELECT count(*)::int AS total FROM (${coincidencias}) c`,
    ]);

    const ids = pagina.map((r) => r.id);
    const rows = ids.length
      ? await this.prisma.libro.findMany({
          where: { id: { in: ids } },
          include: LIBRO_INCLUDE,
        })
      : [];
    const porId = new Map(rows.map((r) => [r.id, LibroMapper.toDomain(r)]));
    return {
      items: ids.flatMap((id) => porId.get(id) ?? []),
      total: conteo[0]?.total ?? 0,
    };
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

/** Escapa los comodines de LIKE (% y _) para que el texto del usuario se busque literal. */
function escaparLike(texto: string): string {
  return texto.replace(/[\\%_]/g, '\\$&');
}

/** La base no garantiza el orden de `IN`; se respeta el orden en que se pidieron. */
function enOrden(ids: string[], rows: Referencia[]): Referencia[] {
  const porId = new Map(rows.map((r) => [r.id, r]));
  return ids.flatMap((id) => {
    const r = porId.get(id);
    return r ? [r] : [];
  });
}
