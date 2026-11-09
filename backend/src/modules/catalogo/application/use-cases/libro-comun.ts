import {
  ConflictError,
  ValidationError,
} from '../../../../shared/domain/domain-error';
import { Libro, Referencia } from '../../domain/entities/libro';
import { LibroRepository } from '../../domain/repositories/libro.repository';
import { LibroOutput } from '../dtos/libro.dto';

/** Funciones que comparten los casos de uso de libros (HU-16). */

export function aLibroOutput(libro: Libro): LibroOutput {
  return {
    id: libro.id,
    titulo: libro.titulo,
    anioPublicacion: libro.anioPublicacion,
    idioma: libro.idioma,
    isbn: libro.isbn?.valor ?? null,
    tipoMaterial: libro.tipoMaterial,
    formato: libro.formato,
    enlaceDigital: libro.enlaceDigital,
    autores: libro.autores,
    temas: libro.temas,
    creadoEn: libro.creadoEn.toISOString(),
    actualizadoEn: libro.actualizadoEn.toISOString(),
  };
}

/** Busca los autores pedidos y falla con 400 si alguno no existe. */
export async function resolverAutores(
  libros: LibroRepository,
  ids: string[],
): Promise<Referencia[]> {
  const unicos = [...new Set(ids)];
  const encontrados = await libros.buscarAutores(unicos);
  verificarFaltantes(unicos, encontrados, 'autores');
  return encontrados;
}

/** Busca los temas pedidos y falla con 400 si alguno no existe. */
export async function resolverTemas(
  libros: LibroRepository,
  ids: string[],
): Promise<Referencia[]> {
  const unicos = [...new Set(ids)];
  const encontrados = await libros.buscarTemas(unicos);
  verificarFaltantes(unicos, encontrados, 'temas');
  return encontrados;
}

/** R2: el ISBN es único cuando existe. */
export async function asegurarIsbnUnico(
  libros: LibroRepository,
  libro: Libro,
): Promise<void> {
  if (!libro.isbn) return;
  const otro = await libros.buscarPorIsbn(libro.isbn.valor);
  if (otro && otro.id !== libro.id) {
    throw new ConflictError(
      `Ya existe un libro con el ISBN ${libro.isbn.valor}: «${otro.titulo}»`,
    );
  }
}

function verificarFaltantes(
  pedidos: string[],
  encontrados: Referencia[],
  tipo: 'autores' | 'temas',
): void {
  const existentes = new Set(encontrados.map((r) => r.id));
  const faltantes = pedidos.filter((id) => !existentes.has(id));
  if (faltantes.length > 0) {
    throw new ValidationError(
      `No existen estos ${tipo}: ${faltantes.join(', ')}`,
    );
  }
}
