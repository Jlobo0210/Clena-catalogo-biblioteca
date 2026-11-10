import { Autor } from '../../domain/entities/autor';
import { AutorOutput } from '../dtos/autor.dto';

/** Convierte la entidad de dominio en el DTO plano que devuelve la API. */
export function aAutorOutput(autor: Autor): AutorOutput {
  return {
    id: autor.id,
    nombre: autor.nombre,
    creadoEn: autor.creadoEn.toISOString(),
    actualizadoEn: autor.actualizadoEn.toISOString(),
  };
}
