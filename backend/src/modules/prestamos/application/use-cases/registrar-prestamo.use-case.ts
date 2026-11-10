import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from '../../../../shared/domain/domain-error';
import { IdGenerator } from '../../../../shared/domain/id-generator';
import { Prestamo } from '../../domain/entities/prestamo';
import {
  EstadoEjemplar,
  PrestamoRepository,
} from '../../domain/repositories/prestamo.repository';
import { RegistrarPrestamoInput, PrestamoOutput } from '../dtos/prestamo.dto';
import { PoliticaPrestamos } from '../politica-prestamos';
import { aPrestamoOutput } from './prestamo-output';

const MOTIVO_NO_DISPONIBLE: Record<
  Exclude<EstadoEjemplar, 'DISPONIBLE'>,
  string
> = {
  PRESTADO: 'ya está prestado',
  EN_REPARACION: 'está en reparación',
  PERDIDO: 'está reportado como perdido',
};

/**
 * HU-26: el personal presta un ejemplar a un usuario.
 * Reglas: el ejemplar debe estar DISPONIBLE; el usuario no puede superar el máximo de
 * préstamos sin devolver; la fecha límite sale de la política de préstamos.
 */
export class RegistrarPrestamoUseCase {
  constructor(
    private readonly prestamos: PrestamoRepository,
    private readonly ids: IdGenerator,
    private readonly politica: PoliticaPrestamos,
    private readonly reloj: () => Date = () => new Date(),
  ) {}

  async execute(
    input: RegistrarPrestamoInput,
    registradoPorId: string,
  ): Promise<PrestamoOutput> {
    const refEjemplar = unaSola(
      'el ejemplar',
      input.ejemplarId && { id: input.ejemplarId },
      input.codigoInventario && {
        codigoInventario: input.codigoInventario.trim(),
      },
      'ejemplarId o codigoInventario',
    );
    const refUsuario = unaSola(
      'el usuario',
      input.usuarioId && { id: input.usuarioId },
      input.usuarioEmail && { email: input.usuarioEmail.trim().toLowerCase() },
      'usuarioId o usuarioEmail',
    );

    const ejemplar = await this.prestamos.buscarEjemplar(refEjemplar);
    if (!ejemplar) {
      throw new NotFoundError('Ejemplar no encontrado');
    }
    if (ejemplar.estado !== 'DISPONIBLE') {
      throw new ConflictError(
        `El ejemplar ${ejemplar.codigoInventario} de «${ejemplar.libroTitulo}» no se puede prestar: ${MOTIVO_NO_DISPONIBLE[ejemplar.estado]}.`,
      );
    }

    const usuario = await this.prestamos.buscarUsuario(refUsuario);
    if (!usuario) {
      throw new NotFoundError('Usuario no encontrado');
    }
    const sinDevolver = await this.prestamos.contarSinDevolverDeUsuario(
      usuario.id,
    );
    if (sinDevolver >= this.politica.maxSinDevolverPorUsuario) {
      throw new ConflictError(
        `${usuario.nombre} ya tiene ${sinDevolver} préstamo(s) sin devolver; el máximo es ${this.politica.maxSinDevolverPorUsuario}.`,
      );
    }

    const ahora = this.reloj();
    const prestamo = Prestamo.prestar({
      id: this.ids.generate(),
      ejemplarId: ejemplar.id,
      usuarioId: usuario.id,
      registradoPorId,
      ahora,
      diasPrestamo: this.politica.diasPrestamo,
    });
    await this.prestamos.registrar(prestamo);

    const detalle = await this.prestamos.buscarDetalle(prestamo.id);
    if (!detalle) {
      throw new NotFoundError('Préstamo no encontrado');
    }
    return aPrestamoOutput(detalle, ahora);
  }
}

function unaSola<T>(
  que: string,
  a: T | '' | undefined,
  b: T | '' | undefined,
  campos: string,
): T {
  if (a && b) {
    throw new ValidationError(
      `Indica ${que} de una sola forma: ${campos}, no ambos`,
    );
  }
  const valor = a || b;
  if (!valor) {
    throw new ValidationError(`Indica ${que}: ${campos}`);
  }
  return valor;
}
