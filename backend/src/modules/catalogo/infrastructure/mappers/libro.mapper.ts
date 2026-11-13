import { Prisma } from '@prisma/client';
import { Libro } from '../../domain/entities/libro';
import { Isbn } from '../../domain/value-objects/isbn';

/** Relaciones que se cargan siempre junto con el libro. */
export const LIBRO_INCLUDE = {
  autores: { include: { autor: true }, orderBy: { orden: 'asc' } },
  temas: { include: { tema: true } },
} satisfies Prisma.LibroInclude;

export type LibroConRelaciones = Prisma.LibroGetPayload<{
  include: typeof LIBRO_INCLUDE;
}>;

/** Traduce entre el modelo de Prisma y la entidad de dominio. El modelo de Prisma no sale de aquí. */
export const LibroMapper = {
  toDomain(row: LibroConRelaciones): Libro {
    return Libro.reconstruir({
      id: row.id,
      titulo: row.titulo,
      anioPublicacion: row.anioPublicacion,
      idioma: row.idioma,
      isbn: row.isbn ? Isbn.reconstruir(row.isbn) : null,
      tipoMaterial: row.tipoMaterial,
      formato: row.formato,
      enlaceDigital: row.enlaceDigital,
      autores: row.autores.map((a) => ({
        id: a.autor.id,
        nombre: a.autor.nombre,
      })),
      temas: row.temas
        .map((t) => ({ id: t.tema.id, nombre: t.tema.nombre }))
        .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')),
      creadoEn: row.creadoEn,
      actualizadoEn: row.actualizadoEn,
    });
  },

  /** Columnas propias de la tabla libro (las relaciones se guardan aparte). */
  toPersistence(libro: Libro): Prisma.LibroUncheckedCreateInput {
    return {
      id: libro.id,
      titulo: libro.titulo,
      anioPublicacion: libro.anioPublicacion,
      idioma: libro.idioma,
      isbn: libro.isbn?.valor ?? null,
      tipoMaterial: libro.tipoMaterial,
      formato: libro.formato,
      enlaceDigital: libro.enlaceDigital,
      creadoEn: libro.creadoEn,
      actualizadoEn: libro.actualizadoEn,
    };
  },
};
