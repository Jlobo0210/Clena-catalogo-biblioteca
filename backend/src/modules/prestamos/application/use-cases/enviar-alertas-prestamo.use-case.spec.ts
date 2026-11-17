import {
  AlertasEnMemoria,
  CorreoFalso,
} from '../../../../../test/fakes/alertas.fakes';
import { PrestamosEnMemoria } from '../../../../../test/fakes/prestamos.fakes';
import { Prestamo } from '../../domain/entities/prestamo';
import { EnviarAlertasPrestamoUseCase } from './enviar-alertas-prestamo.use-case';

/** 26 de noviembre de 2026, 10:00 a. m. en Colombia. */
const HOY = new Date('2026-11-26T15:00:00Z');
const MANANA = new Date('2026-11-27T15:00:00Z');

const ANA = 'ana@clena.example';
const BETO = 'beto@clena.example';
const CARLA = 'carla@clena.example';

function prestamo(
  id: string,
  ejemplarId: string,
  usuarioId: string,
  fechaLimite: string,
  fechaDevolucion: Date | null = null,
) {
  return Prestamo.reconstruir({
    id,
    ejemplarId,
    usuarioId,
    registradoPorId: 's-1',
    fechaPrestamo: new Date('2026-11-10T15:00:00Z'),
    fechaLimite,
    fechaDevolucion,
  });
}

function montar() {
  let reloj = HOY;
  const prestamos = new PrestamosEnMemoria()
    .conEjemplar('e-1', 'INV-0001-1', 'Cien años de soledad')
    .conEjemplar('e-2', 'INV-0002-1', 'Rayuela')
    .conEjemplar('e-3', 'INV-0003-1', 'Pedro Páramo')
    .conEjemplar('e-4', 'INV-0004-1', 'Ficciones')
    .conEjemplar('e-5', 'INV-0005-1', 'Aura')
    .conEjemplar('e-6', 'INV-0006-1', 'La vorágine')
    .conUsuario('u-ana', 'Ana Pérez', ANA)
    .conUsuario('u-beto', 'Beto Ruiz', BETO)
    .conUsuario('u-carla', 'Carla Díaz', CARLA)
    .conUsuario('u-anonimo', 'usuario-eliminado-1', 'eliminado@clena.example');
  for (const p of [
    prestamo('p-hoy', 'e-1', 'u-ana', '2026-11-26'), // vence hoy
    prestamo('p-2dias', 'e-2', 'u-beto', '2026-11-28'), // vence en 2 días
    prestamo('p-3dias', 'e-3', 'u-ana', '2026-11-29'), // fuera de la ventana de 2 días
    prestamo('p-vencido', 'e-4', 'u-carla', '2026-11-25'), // venció ayer
    prestamo('p-devuelto', 'e-5', 'u-beto', '2026-11-27', HOY), // ya devuelto
    prestamo('p-anonimo', 'e-6', 'u-anonimo', '2026-11-27'), // cuenta eliminada
  ]) {
    prestamos.filas.set(p.id, p);
  }
  const alertas = new AlertasEnMemoria(prestamos);
  alertas.anonimizados.add('u-anonimo');
  const correo = new CorreoFalso();
  const caso = new EnviarAlertasPrestamoUseCase(
    alertas,
    correo,
    { diasAntes: 2 },
    () => reloj,
  );
  return { caso, alertas, correo, avanzarA: (d: Date) => (reloj = d) };
}

describe('Alertas de devolución (HU-29)', () => {
  it('envía el recordatorio a quien vence en los próximos días y el aviso a quien ya venció', async () => {
    const { caso, correo, alertas } = montar();

    const resultado = await caso.execute();

    expect(resultado).toEqual({
      hoy: '2026-11-26',
      recordatorios: 2,
      vencimientos: 1,
      fallos: [],
    });
    expect(correo.enviados.map((m) => [m.para, m.asunto])).toEqual([
      [ANA, 'Recordatorio: tu préstamo de «Cien años de soledad» vence hoy'],
      [BETO, 'Recordatorio: tu préstamo de «Rayuela» vence en 2 días'],
      [CARLA, 'Tu préstamo de «Ficciones» está vencido'],
    ]);
    // Ni el devuelto, ni el de la cuenta eliminada, ni el que vence en 3 días.
    expect(correo.para('eliminado@clena.example')).toHaveLength(0);
    expect([...alertas.enviadas.keys()]).toEqual([
      'p-hoy:RECORDATORIO',
      'p-2dias:RECORDATORIO',
      'p-vencido:VENCIMIENTO',
    ]);
    expect(alertas.enviadas.get('p-hoy:RECORDATORIO')).toEqual(HOY);
  });

  it('el correo dice qué libro, qué ejemplar, la fecha límite y los días de retraso', async () => {
    const { caso, correo } = montar();
    await caso.execute();

    const [recordatorio] = correo.para(BETO);
    expect(recordatorio.texto).toContain('Hola, Beto Ruiz:');
    expect(recordatorio.texto).toContain(
      'el préstamo de «Rayuela» (ejemplar INV-0002-1) vence en 2 días, el sábado 28 de noviembre de 2026.',
    );

    const [aviso] = correo.para(CARLA);
    expect(aviso.texto).toContain(
      'venció el miércoles 25 de noviembre de 2026 y lleva 1 día de retraso.',
    );
  });

  it('cada alerta se envía una sola vez por préstamo, aunque la tarea corra de nuevo (R14)', async () => {
    const { caso, correo, avanzarA } = montar();
    await caso.execute();
    correo.enviados.length = 0;

    // El mismo día no se repite nada.
    expect(await caso.execute()).toMatchObject({
      recordatorios: 0,
      vencimientos: 0,
    });
    expect(correo.enviados).toHaveLength(0);

    // Al día siguiente: entra en la ventana el que vence el 29, y el que vencía ayer ya venció.
    avanzarA(MANANA);
    expect(await caso.execute()).toMatchObject({
      hoy: '2026-11-27',
      recordatorios: 1,
      vencimientos: 1,
    });
    expect(correo.enviados.map((m) => m.asunto)).toEqual([
      'Recordatorio: tu préstamo de «Pedro Páramo» vence en 2 días',
      'Tu préstamo de «Cien años de soledad» está vencido',
    ]);
  });

  it('si un envío falla, sigue con los demás y lo reintenta en la próxima ejecución', async () => {
    const { caso, correo, alertas } = montar();
    correo.fallarPara.add(BETO);

    const resultado = await caso.execute();
    expect(resultado.recordatorios).toBe(1);
    expect(resultado.vencimientos).toBe(1);
    expect(resultado.fallos).toEqual([
      {
        prestamoId: 'p-2dias',
        tipo: 'RECORDATORIO',
        motivo: 'Servidor de correo no disponible',
      },
    ]);
    expect(alertas.enviadas.has('p-2dias:RECORDATORIO')).toBe(false);

    correo.fallarPara.clear();
    const reintento = await caso.execute();
    expect(reintento).toMatchObject({ recordatorios: 1, fallos: [] });
    expect(correo.para(BETO)).toHaveLength(1);
  });

  it('no envía lo que otra ejecución ya tomó', async () => {
    const { caso, correo, alertas } = montar();
    jest
      .spyOn(alertas, 'reservar')
      .mockImplementation((prestamoId) =>
        Promise.resolve(prestamoId !== 'p-hoy'),
      );

    const resultado = await caso.execute();
    expect(resultado.recordatorios).toBe(1);
    expect(correo.para(ANA)).toHaveLength(0);
  });

  it('el recordatorio dice «mañana» cuando falta un día', async () => {
    const { caso, correo, avanzarA } = montar();
    avanzarA(new Date('2026-11-28T03:00:00Z')); // 27 de noviembre, 10 p. m. en Colombia
    await caso.execute();
    expect(correo.para(BETO)[0].asunto).toBe(
      'Recordatorio: tu préstamo de «Rayuela» vence mañana',
    );
  });

  it('si el error no trae mensaje, el motivo usa su código (p. ej. ECONNREFUSED)', async () => {
    const { caso, correo } = montar();
    jest
      .spyOn(correo, 'enviar')
      .mockRejectedValueOnce(
        Object.assign(new AggregateError([], ''), { code: 'ECONNREFUSED' }),
      )
      .mockRejectedValueOnce(new AggregateError([], ''))
      .mockRejectedValueOnce('sin conexión');

    const { fallos } = await caso.execute();
    expect(fallos.map((f) => f.motivo)).toEqual([
      'ECONNREFUSED',
      'AggregateError',
      'sin conexión',
    ]);
  });
});
