import { ConflictError } from '../../../../shared/domain/domain-error';
import { Tema } from '../../domain/entities/tema';
import { TemaRepository } from '../../domain/repositories/tema.repository';
import { TemaOutput } from '../dtos/tema.dto';

/** Convierte la entidad de dominio en el DTO plano que devuelve la API. */
export function aTemaOutput(tema: Tema, totalLibros = 0): TemaOutput {
  return {
    id: tema.id,
    nombre: tema.nombre,
    descripcion: tema.descripcion,
    totalLibros,
    creadoEn: tema.creadoEn.toISOString(),
    actualizadoEn: tema.actualizadoEn.toISOString(),
  };
}

/** No puede haber dos temas con el mismo nombre (sin importar mayúsculas). */
export async function asegurarNombreLibre(
  temas: TemaRepository,
  tema: Tema,
): Promise<void> {
  const existente = await temas.buscarPorNombre(tema.nombre);
  if (existente && existente.id !== tema.id) {
    throw new ConflictError(`Ya existe un tema llamado «${existente.nombre}»`);
  }
}
