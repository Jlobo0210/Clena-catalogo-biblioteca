import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import {
  EnviarAlertasPrestamoUseCase,
  ResultadoAlertas,
} from '../../application/use-cases/enviar-alertas-prestamo.use-case';
import {
  AlertasPrestamoTarea,
  HORARIO_POR_DEFECTO,
} from './alertas-prestamo.tarea';

const RESULTADO: ResultadoAlertas = {
  hoy: '2026-11-26',
  recordatorios: 2,
  vencimientos: 1,
  fallos: [{ prestamoId: 'p-1', tipo: 'RECORDATORIO', motivo: 'sin red' }],
};

function montar(entorno: Record<string, string> = {}) {
  const execute = jest.fn<Promise<ResultadoAlertas>, []>();
  const registro = new SchedulerRegistry();
  const tarea = new AlertasPrestamoTarea(
    { execute } as unknown as EnviarAlertasPrestamoUseCase,
    { get: (clave: string) => entorno[clave] } as unknown as ConfigService,
    registro,
  );
  return { tarea, execute, registro };
}

describe('Tarea programada de alertas (HU-29)', () => {
  let tareas: CronJob[] = [];
  let log: jest.SpyInstance;
  let warn: jest.SpyInstance;
  let error: jest.SpyInstance;

  beforeEach(() => {
    log = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    error = jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    for (const t of tareas) void t.stop();
    tareas = [];
    jest.restoreAllMocks();
  });

  const programada = (registro: SchedulerRegistry) => {
    const t = registro.getCronJob('alertas-prestamo');
    tareas.push(t);
    return t;
  };

  it('por defecto corre todos los días a las 8:00, hora de Colombia', () => {
    const { tarea, registro } = montar();
    tarea.onApplicationBootstrap();
    const t = programada(registro);
    expect(t.cronTime.source).toBe(HORARIO_POR_DEFECTO);
    expect(t.cronTime.timeZone).toBe('America/Bogota');
    expect(t.isActive).toBe(true);
  });

  it('respeta ALERTAS_HORARIO y, si no es válido, usa el de por defecto', () => {
    const valido = montar({ ALERTAS_HORARIO: '30 7 * * 1-5' });
    valido.tarea.onApplicationBootstrap();
    expect(programada(valido.registro).cronTime.source).toBe('30 7 * * 1-5');

    const invalido = montar({ ALERTAS_HORARIO: 'cada mañana' });
    invalido.tarea.onApplicationBootstrap();
    expect(programada(invalido.registro).cronTime.source).toBe(
      HORARIO_POR_DEFECTO,
    );
    expect(error).toHaveBeenCalled();
  });

  it('con ALERTAS_ACTIVAS=false no programa nada', () => {
    const { tarea, registro } = montar({ ALERTAS_ACTIVAS: 'false' });
    tarea.onApplicationBootstrap();
    expect(registro.getCronJobs().size).toBe(0);
  });

  it('registra el resultado y los fallos en el log', async () => {
    const { tarea, execute } = montar();
    execute.mockResolvedValue(RESULTADO);
    await expect(tarea.ejecutar()).resolves.toBe(RESULTADO);
    expect(log).toHaveBeenCalledWith(
      expect.stringContaining('2 recordatorios y 1 avisos de vencimiento'),
    );
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('préstamo p-1: sin red'),
    );
  });

  it('no se solapa consigo misma y un error no la detiene', async () => {
    const { tarea, execute } = montar();
    let terminar!: (r: ResultadoAlertas) => void;
    execute.mockReturnValueOnce(new Promise((r) => (terminar = r)));

    const primera = tarea.ejecutar();
    await expect(tarea.ejecutar()).resolves.toBeNull();
    terminar(RESULTADO);
    await expect(primera).resolves.toBe(RESULTADO);

    execute.mockRejectedValueOnce(new Error('base caída'));
    await expect(tarea.ejecutar()).resolves.toBeNull();
    expect(error).toHaveBeenCalled();

    execute.mockResolvedValueOnce(RESULTADO);
    await expect(tarea.ejecutar()).resolves.toBe(RESULTADO);
  });
});
