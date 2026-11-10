/** Repositorio de préstamos en memoria, para pruebas unitarias y e2e (sin base de datos). */
import { ConflictError } from '../../src/shared/domain/domain-error';
import { Prestamo } from '../../src/modules/prestamos/domain/entities/prestamo';
import {
  EjemplarParaPrestamo,
  FiltroPrestamos,
  PrestamoDetalle,
  PrestamoRepository,
  UsuarioParaPrestamo,
} from '../../src/modules/prestamos/domain/repositories/prestamo.repository';

export class PrestamosEnMemoria implements PrestamoRepository {
  readonly filas = new Map<string, Prestamo>();
  readonly ejemplares = new Map<
    string,
    EjemplarParaPrestamo & { libroId: string }
  >();
  readonly usuarios = new Map<string, UsuarioParaPrestamo>();

  conEjemplar(
    id: string,
    codigoInventario: string,
    libroTitulo = 'Cien años de soledad',
    estado: EjemplarParaPrestamo['estado'] = 'DISPONIBLE',
  ): this {
    this.ejemplares.set(id, {
      id,
      codigoInventario,
      estado,
      libroTitulo,
      libroId: `libro-${codigoInventario}`,
    });
    return this;
  }

  conUsuario(id: string, nombre: string, email: string): this {
    this.usuarios.set(id, { id, nombre, email });
    return this;
  }

  buscarEjemplar(
    ref: { id: string } | { codigoInventario: string },
  ): Promise<EjemplarParaPrestamo | null> {
    const e =
      'id' in ref
        ? this.ejemplares.get(ref.id)
        : [...this.ejemplares.values()].find(
            (x) => x.codigoInventario === ref.codigoInventario,
          );
    return Promise.resolve(e ? { ...e } : null);
  }

  buscarUsuario(
    ref: { id: string } | { email: string },
  ): Promise<UsuarioParaPrestamo | null> {
    const u =
      'id' in ref
        ? this.usuarios.get(ref.id)
        : [...this.usuarios.values()].find((x) => x.email === ref.email);
    return Promise.resolve(u ?? null);
  }

  contarSinDevolverDeUsuario(usuarioId: string): Promise<number> {
    return Promise.resolve(
      [...this.filas.values()].filter(
        (p) => p.usuarioId === usuarioId && !p.fechaDevolucion,
      ).length,
    );
  }

  registrar(p: Prestamo): Promise<void> {
    const ejemplar = this.ejemplares.get(p.ejemplarId);
    if (!ejemplar || ejemplar.estado !== 'DISPONIBLE') {
      return Promise.reject(
        new ConflictError('El ejemplar ya no está disponible para préstamo'),
      );
    }
    ejemplar.estado = 'PRESTADO';
    this.filas.set(p.id, p);
    return Promise.resolve();
  }

  buscarPorId(id: string): Promise<Prestamo | null> {
    const p = this.filas.get(id);
    return Promise.resolve(
      p
        ? Prestamo.reconstruir({
            id: p.id,
            ejemplarId: p.ejemplarId,
            usuarioId: p.usuarioId,
            registradoPorId: p.registradoPorId,
            fechaPrestamo: p.fechaPrestamo,
            fechaLimite: p.fechaLimite,
            fechaDevolucion: p.fechaDevolucion,
          })
        : null,
    );
  }

  registrarDevolucion(p: Prestamo): Promise<void> {
    if (this.filas.get(p.id)?.fechaDevolucion) {
      return Promise.reject(new ConflictError('Este préstamo ya fue devuelto'));
    }
    this.filas.set(p.id, p);
    const ejemplar = this.ejemplares.get(p.ejemplarId);
    if (ejemplar?.estado === 'PRESTADO') ejemplar.estado = 'DISPONIBLE';
    return Promise.resolve();
  }

  buscarDetalle(id: string): Promise<PrestamoDetalle | null> {
    const p = this.filas.get(id);
    return Promise.resolve(p ? this.detalle(p) : null);
  }

  listar(
    f: FiltroPrestamos,
  ): Promise<{ items: PrestamoDetalle[]; total: number }> {
    const signo = f.direccion === 'asc' ? 1 : -1;
    const todos = [...this.filas.values()]
      .filter(
        (p) =>
          (!f.estado ||
            (f.estado === 'SIN_DEVOLVER' && !p.fechaDevolucion) ||
            (f.estado === 'VENCIDO' &&
              !p.fechaDevolucion &&
              p.fechaLimite < f.hoy) ||
            (f.estado === 'DEVUELTO' && !!p.fechaDevolucion)) &&
          (!f.usuarioId || p.usuarioId === f.usuarioId) &&
          (!f.ejemplarId || p.ejemplarId === f.ejemplarId),
      )
      .sort((a, b) => {
        const va =
          f.ordenarPor === 'fechaLimite'
            ? a.fechaLimite
            : a.fechaPrestamo.toISOString();
        const vb =
          f.ordenarPor === 'fechaLimite'
            ? b.fechaLimite
            : b.fechaPrestamo.toISOString();
        return va === vb
          ? a.id.localeCompare(b.id)
          : (va > vb ? 1 : -1) * signo;
      });
    const inicio = (f.pagina - 1) * f.tamano;
    return Promise.resolve({
      items: todos.slice(inicio, inicio + f.tamano).map((p) => this.detalle(p)),
      total: todos.length,
    });
  }

  private detalle(p: Prestamo): PrestamoDetalle {
    const e = this.ejemplares.get(p.ejemplarId)!;
    const u = this.usuarios.get(p.usuarioId)!;
    return {
      id: p.id,
      ejemplar: { id: e.id, codigoInventario: e.codigoInventario },
      libro: { id: e.libroId, titulo: e.libroTitulo },
      usuario: { ...u },
      registradoPor: {
        id: p.registradoPorId,
        nombre: this.usuarios.get(p.registradoPorId)?.nombre ?? 'Personal',
      },
      fechaPrestamo: p.fechaPrestamo,
      fechaLimite: p.fechaLimite,
      fechaDevolucion: p.fechaDevolucion,
    };
  }
}
