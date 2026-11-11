import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from '../../../../shared/domain/domain-error';
import { IdsSecuenciales } from '../../../../../test/fakes/auth.fakes';
import { PrestamosEnMemoria } from '../../../../../test/fakes/prestamos.fakes';
import { ListarMisPrestamosUseCase } from './listar-mis-prestamos.use-case';
import { ListarPrestamosUseCase } from './listar-prestamos.use-case';
import { ObtenerPrestamoUseCase } from './obtener-prestamo.use-case';
import { RegistrarDevolucionUseCase } from './registrar-devolucion.use-case';
import { RegistrarPrestamoUseCase } from './registrar-prestamo.use-case';

const PRESTADO_EL = new Date('2026-11-10T15:00:00Z');

function montar(ahora = PRESTADO_EL) {
  let reloj = ahora;
  const prestamos = new PrestamosEnMemoria()
    .conEjemplar('e-1', 'INV-0000-1')
    .conEjemplar('e-2', 'INV-0000-2')
    .conEjemplar('e-3', 'INV-0001-1', 'Arquitectura, vol. 1', 'EN_REPARACION')
    .conEjemplar('e-4', 'INV-0002-1', 'Redes, vol. 2')
    .conUsuario('u-1', 'Visitante Demo', 'publico@clena.example')
    .conUsuario('s-1', 'Personal Demo', 'personal@clena.example');
  const ahoraFn = () => reloj;
  return {
    prestamos,
    avanzarA: (fecha: Date) => (reloj = fecha),
    prestar: new RegistrarPrestamoUseCase(
      prestamos,
      new IdsSecuenciales(),
      { diasPrestamo: 15, maxSinDevolverPorUsuario: 2 },
      ahoraFn,
    ),
    devolver: new RegistrarDevolucionUseCase(prestamos, ahoraFn),
    listar: new ListarPrestamosUseCase(prestamos, ahoraFn),
    obtener: new ObtenerPrestamoUseCase(prestamos, ahoraFn),
  };
}

describe('RegistrarPrestamoUseCase (HU-26)', () => {
  it('presta por código de inventario y correo: el ejemplar pasa a PRESTADO', async () => {
    const s = montar();

    const p = await s.prestar.execute(
      {
        codigoInventario: ' INV-0000-1 ',
        usuarioEmail: 'Publico@Clena.example',
      },
      's-1',
    );

    expect(p).toMatchObject({
      estado: 'ACTIVO',
      fechaPrestamo: PRESTADO_EL.toISOString(),
      fechaLimite: '2026-11-25',
      fechaDevolucion: null,
      diasRestantes: 15,
      ejemplar: { id: 'e-1', codigoInventario: 'INV-0000-1' },
      libro: { titulo: 'Cien años de soledad' },
      usuario: { id: 'u-1', nombre: 'Visitante Demo' },
      registradoPor: { id: 's-1', nombre: 'Personal Demo' },
    });
    expect(s.prestamos.ejemplares.get('e-1')?.estado).toBe('PRESTADO');
  });

  it('no presta un ejemplar que no está disponible', async () => {
    const s = montar();
    await s.prestar.execute({ ejemplarId: 'e-1', usuarioId: 'u-1' }, 's-1');

    await expect(
      s.prestar.execute({ ejemplarId: 'e-1', usuarioId: 'u-1' }, 's-1'),
    ).rejects.toThrow('ya está prestado');
    await expect(
      s.prestar.execute({ ejemplarId: 'e-3', usuarioId: 'u-1' }, 's-1'),
    ).rejects.toThrow('está en reparación');
    expect(s.prestamos.filas.size).toBe(1);
  });

  it('respeta el máximo de préstamos sin devolver por usuario', async () => {
    const s = montar();
    await s.prestar.execute({ ejemplarId: 'e-1', usuarioId: 'u-1' }, 's-1');
    await s.prestar.execute({ ejemplarId: 'e-2', usuarioId: 'u-1' }, 's-1');

    await expect(
      s.prestar.execute({ ejemplarId: 'e-4', usuarioId: 'u-1' }, 's-1'),
    ).rejects.toThrow('el máximo es 2');
    expect(s.prestamos.ejemplares.get('e-4')?.estado).toBe('DISPONIBLE');
  });

  it('devuelve 404 si el ejemplar o el usuario no existen', async () => {
    const s = montar();
    await expect(
      s.prestar.execute(
        { codigoInventario: 'NO-EXISTE', usuarioId: 'u-1' },
        's-1',
      ),
    ).rejects.toThrow('Ejemplar no encontrado');
    await expect(
      s.prestar.execute(
        { ejemplarId: 'e-1', usuarioEmail: 'nadie@x.co' },
        's-1',
      ),
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(s.prestamos.ejemplares.get('e-1')?.estado).toBe('DISPONIBLE');
  });

  it('exige indicar ejemplar y usuario de una sola forma', async () => {
    const s = montar();
    for (const input of [
      { usuarioId: 'u-1' },
      { ejemplarId: 'e-1' },
      { ejemplarId: 'e-1', codigoInventario: 'INV-0000-1', usuarioId: 'u-1' },
      {
        ejemplarId: 'e-1',
        usuarioId: 'u-1',
        usuarioEmail: 'publico@clena.example',
      },
    ]) {
      await expect(s.prestar.execute(input, 's-1')).rejects.toBeInstanceOf(
        ValidationError,
      );
    }
  });
});

describe('RegistrarDevolucionUseCase (HU-26)', () => {
  it('registra la devolución, libera el ejemplar y conserva el historial', async () => {
    const s = montar();
    const { id } = await s.prestar.execute(
      { ejemplarId: 'e-1', usuarioId: 'u-1' },
      's-1',
    );
    const devueltoEl = new Date('2026-11-20T16:00:00Z');
    s.avanzarA(devueltoEl);

    const p = await s.devolver.execute(id);

    expect(p).toMatchObject({
      estado: 'DEVUELTO',
      fechaDevolucion: devueltoEl.toISOString(),
      diasRestantes: null,
    });
    expect(s.prestamos.ejemplares.get('e-1')?.estado).toBe('DISPONIBLE');
    expect(s.prestamos.filas.size).toBe(1);
    // Ya disponible, se puede volver a prestar.
    await expect(
      s.prestar.execute({ ejemplarId: 'e-1', usuarioId: 'u-1' }, 's-1'),
    ).resolves.toMatchObject({ estado: 'ACTIVO' });
  });

  it('no devuelve dos veces y responde 404 si no existe', async () => {
    const s = montar();
    const { id } = await s.prestar.execute(
      { ejemplarId: 'e-1', usuarioId: 'u-1' },
      's-1',
    );
    await s.devolver.execute(id);

    await expect(s.devolver.execute(id)).rejects.toBeInstanceOf(ConflictError);
    await expect(s.devolver.execute('no-existe')).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});

describe('ListarPrestamosUseCase y ObtenerPrestamoUseCase', () => {
  async function conHistorial() {
    const s = montar();
    const a = await s.prestar.execute(
      { ejemplarId: 'e-1', usuarioId: 'u-1' },
      's-1',
    );
    s.avanzarA(new Date('2026-11-12T15:00:00Z'));
    const b = await s.prestar.execute(
      { ejemplarId: 'e-2', usuarioId: 'u-1' },
      's-1',
    );
    await s.devolver.execute(b.id);
    s.avanzarA(new Date('2026-11-30T15:00:00Z')); // el préstamo «a» venció el 25
    return { s, a, b };
  }

  it('marca como VENCIDO lo que pasó el día límite sin devolver', async () => {
    const { a, s } = await conHistorial();
    await expect(s.obtener.execute(a.id)).resolves.toMatchObject({
      estado: 'VENCIDO',
      diasRestantes: -5,
    });
  });

  it('filtra por estado y ordena por fecha de préstamo (recientes primero)', async () => {
    const { a, b, s } = await conHistorial();

    const todos = await s.listar.execute();
    expect(todos.items.map((p) => p.id)).toEqual([b.id, a.id]);
    await expect(
      s.listar.execute({ estado: 'VENCIDO' }),
    ).resolves.toMatchObject({
      total: 1,
      items: [{ id: a.id }],
    });
    await expect(
      s.listar.execute({ estado: 'SIN_DEVOLVER' }),
    ).resolves.toMatchObject({
      total: 1,
    });
    await expect(
      s.listar.execute({ estado: 'DEVUELTO' }),
    ).resolves.toMatchObject({
      items: [{ id: b.id }],
    });
    await expect(
      s.listar.execute({ ejemplarId: 'e-2', pagina: 0, tamano: 500 }),
    ).resolves.toMatchObject({ total: 1, pagina: 1, tamano: 100 });
  });

  it('obtener responde 404 si no existe', async () => {
    const s = montar();
    await expect(s.obtener.execute('no-existe')).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});

describe('ListarMisPrestamosUseCase (HU-27)', () => {
  it('solo devuelve los préstamos del usuario indicado', async () => {
    const s = montar();
    s.prestamos.conUsuario('u-2', 'Otra Persona', 'otra@example.com');
    await s.prestar.execute({ ejemplarId: 'e-1', usuarioId: 'u-1' }, 's-1');
    await s.prestar.execute({ ejemplarId: 'e-2', usuarioId: 'u-2' }, 's-1');
    const mios = new ListarMisPrestamosUseCase(s.listar);

    const pagina = await mios.execute('u-1', {
      estado: 'SIN_DEVOLVER',
      ordenarPor: 'fechaLimite',
      direccion: 'asc',
    });

    expect(pagina).toMatchObject({
      total: 1,
      items: [{ usuario: { id: 'u-1' }, ejemplar: { id: 'e-1' } }],
    });
  });
});
