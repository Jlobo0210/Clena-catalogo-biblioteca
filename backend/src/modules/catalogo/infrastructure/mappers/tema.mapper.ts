import { Tema as TemaPrisma } from '@prisma/client';
import { Tema } from '../../domain/entities/tema';

/** Convierte un nombre en un identificador para URL: «Bases de datos» → «bases-de-datos». */
export function aSlug(nombre: string): string {
  return nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/** Traduce entre el modelo de Prisma y la entidad de dominio. El modelo de Prisma no sale de aquí. */
export const TemaMapper = {
  toDomain(row: TemaPrisma): Tema {
    return Tema.reconstruir({
      id: row.id,
      nombre: row.nombre,
      descripcion: row.descripcion,
      creadoEn: row.creadoEn,
      actualizadoEn: row.actualizadoEn,
    });
  },

  toPersistence(
    tema: Tema,
  ): Pick<
    TemaPrisma,
    'id' | 'nombre' | 'slug' | 'descripcion' | 'creadoEn' | 'actualizadoEn'
  > {
    return {
      id: tema.id,
      nombre: tema.nombre,
      slug: aSlug(tema.nombre),
      descripcion: tema.descripcion,
      creadoEn: tema.creadoEn,
      actualizadoEn: tema.actualizadoEn,
    };
  },
};
