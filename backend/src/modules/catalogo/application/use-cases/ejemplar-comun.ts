import { Ejemplar } from '../../domain/entities/ejemplar';
import { EjemplarOutput } from '../dtos/ejemplar.dto';

export function aEjemplarOutput(e: Ejemplar): EjemplarOutput {
  return {
    id: e.id,
    libroId: e.libroId,
    ubicacion: e.ubicacion,
    codigoInventario: e.codigoInventario,
    estado: e.estado,
    observaciones: e.observaciones,
    creadoEn: e.creadoEn.toISOString(),
    actualizadoEn: e.actualizadoEn.toISOString(),
  };
}
