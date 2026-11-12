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
   * HU-20 y HU-21: cada término debe aparecer en el título, en algún autor o en algún tema.
   * Se compara sin tildes ni mayúsculas (f_unaccent + lower) y, para palabras de 4 o más
   * letras, también con errores de escritura (pg_trgm: `<%`, word_similarity ≥ 0,6).
   * Cada comparación coincide con la expresión de los índices GIN de la migración inicial,
   * así PostgreSQL puede usarlos.
   *
   * Relevancia por término: 3 en el título, 2 en un autor, 1 en un tema; si la coincidencia
   * es aproximada, se multiplica por su similitud. Además, +5 si el título contiene la
   * frase completa y +3 si empieza con ella.
   * Prisma no ordena por una expresión calculada, por eso la consulta es SQL.
   */
  async buscar(
    c: ConsultaBusqueda,
  ): Promise<{ items: Libro[]; total: number }> {
    const frase = escaparLike(c.frase);
    const coincidencias = Prisma.sql`
      WITH termino AS (
        SELECT DISTINCT t,
          '%' || replace(replace(replace(t, '\\', '\\\\'), '%', '\\%'), '_', '\\_') || '%' AS patron
        FROM (SELECT f_unaccent(lower(p)) AS t FROM unnest(${c.terminos}::text[]) AS p) x
      ),
      coincidencia AS (
        SELECT tr.t, l.id AS libro_id,
          3 * CASE WHEN f_unaccent(lower(l.titulo)) LIKE tr.patron THEN 1
                   ELSE word_similarity(tr.t, f_unaccent(lower(l.titulo))) END AS puntos
        FROM termino tr
        JOIN libro l ON f_unaccent(lower(l.titulo)) LIKE tr.patron
          OR (length(tr.t) >= 4 AND tr.t <% f_unaccent(lower(l.titulo)))
        UNION ALL
        SELECT tr.t, la.libro_id,
          2 * CASE WHEN f_unaccent(lower(a.nombre)) LIKE tr.patron THEN 1
                   ELSE word_similarity(tr.t, f_unaccent(lower(a.nombre))) END
        FROM termino tr
        JOIN autor a ON f_unaccent(lower(a.nombre)) LIKE tr.patron
          OR (length(tr.t) >= 4 AND tr.t <% f_unaccent(lower(a.nombre)))
        JOIN libro_autor la ON la.autor_id = a.id
        UNION ALL
        SELECT tr.t, lt.libro_id,
          1 * CASE WHEN f_unaccent(lower(te.nombre)) LIKE tr.patron THEN 1
                   ELSE word_similarity(tr.t, f_unaccent(lower(te.nombre))) END
        FROM termino tr
        JOIN tema te ON f_unaccent(lower(te.nombre)) LIKE tr.patron
          OR (length(tr.t) >= 4 AND tr.t <% f_unaccent(lower(te.nombre)))
        JOIN libro_tema lt ON lt.tema_id = te.id
      ),
      por_libro AS (
        SELECT libro_id, count(DISTINCT t) AS cubiertos, sum(puntos) AS puntos
        FROM coincidencia GROUP BY libro_id
      )
      SELECT l.id, l.titulo,
        pl.puntos
        + CASE WHEN f_unaccent(lower(l.titulo)) LIKE '%' || f_unaccent(lower(${frase})) || '%' THEN 5 ELSE 0 END
        + CASE WHEN f_unaccent(lower(l.titulo)) LIKE f_unaccent(lower(${frase})) || '%' THEN 3 ELSE 0 END
          AS relevancia
      FROM por_libro pl
      JOIN libro l ON l.id = pl.libro_id
      -- Cada término tiene que aparecer en algún lado.
      WHERE pl.cubiertos = (SELECT count(*) FROM termino)`;

    // HU-22: filtros que se aplican sobre el conjunto de resultados del FTS.
    const filtros: Prisma.Sql[] = [];
    if (c.idioma) filtros.push(Prisma.sql`l.idioma = ${c.idioma}`);
    if (c.tipoMaterial)
      filtros.push(
        Prisma.sql`l.tipo_material = ${c.tipoMaterial}::"TipoMaterial"`,
      );
    if (c.temaId)
      filtros.push(
        Prisma.sql`EXISTS (SELECT 1 FROM libro_tema lt2 WHERE lt2.libro_id = l.id AND lt2.tema_id = ${c.temaId})`,
      );
    if (c.anioDesde !== undefined)
      filtros.push(Prisma.sql`l.anio_publicacion >= ${c.anioDesde}`);
    if (c.anioHasta !== undefined)
      filtros.push(Prisma.sql`l.anio_publicacion <= ${c.anioHasta}`);
    if (c.soloDisponibles)
      filtros.push(
        Prisma.sql`EXISTS (SELECT 1 FROM ejemplar e WHERE e.libro_id = l.id AND e.estado = 'DISPONIBLE'::"EstadoEjemplar")`,
      );

    const clausulaFiltros =
      filtros.length > 0
        ? Prisma.sql` AND ${Prisma.join(filtros, ' AND ')}`
        : Prisma.empty;

    // HU-22: orden configurable; por defecto sigue siendo relevancia.
    const ordenSQL =
      c.ordenarPor === 'titulo'
        ? Prisma.sql`titulo ${c.direccion === 'desc' ? Prisma.sql`DESC` : Prisma.sql`ASC`}, id ASC`
        : c.ordenarPor === 'anio'
          ? Prisma.sql`anio_publicacion ${c.direccion === 'desc' ? Prisma.sql`DESC NULLS LAST` : Prisma.sql`ASC NULLS LAST`}, id ASC`
          : Prisma.sql`relevancia DESC, titulo ASC, id ASC`;

    const [pagina, conteo] = await this.prisma.$transaction([
      this.prisma.$queryRaw<{ id: string }[]>`
        SELECT id FROM (${coincidencias}) c
        JOIN libro l ON l.id = c.id
        WHERE 1=1${clausulaFiltros}
        ORDER BY ${ordenSQL}
        LIMIT ${c.tamano} OFFSET ${(c.pagina - 1) * c.tamano}`,
      this.prisma.$queryRaw<{ total: number }[]>`
        SELECT count(*)::int AS total
        FROM (${coincidencias}) c
        JOIN libro l ON l.id = c.id
        WHERE 1=1${clausulaFiltros}`,
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
