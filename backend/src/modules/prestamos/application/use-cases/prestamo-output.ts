import { diasRestantes, estadoPrestamo } from '../../domain/entities/prestamo';
import { PrestamoDetalle } from '../../domain/repositories/prestamo.repository';
import { PrestamoOutput } from '../dtos/prestamo.dto';

export function aPrestamoOutput(
  p: PrestamoDetalle,
  ahora: Date,
): PrestamoOutput {
  const dias = diasRestantes(p.fechaLimite, p.fechaDevolucion, ahora);
  return {
    id: p.id,
    estado: estadoPrestamo(p.fechaLimite, p.fechaDevolucion, ahora),
    fechaPrestamo: p.fechaPrestamo.toISOString(),
    fechaLimite: p.fechaLimite,
    fechaDevolucion: p.fechaDevolucion?.toISOString() ?? null,
    diasRestantes: dias,
    diasRetraso: dias === null ? null : Math.max(0, -dias),
    ejemplar: p.ejemplar,
    libro: p.libro,
    usuario: p.usuario,
    registradoPor: p.registradoPor,
  };
}
