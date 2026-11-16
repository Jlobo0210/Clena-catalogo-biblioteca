import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import {
  EnviarAlertasPrestamoUseCase,
  ResultadoAlertas,
} from '../../application/use-cases/enviar-alertas-prestamo.use-case';

/** Todos los días a las 8:00 de la mañana, hora de Colombia. */
export const HORARIO_POR_DEFECTO = '0 8 * * *';
const ZONA_HORARIA = 'America/Bogota';
const NOMBRE = 'alertas-prestamo';

/**
 * HU-29: tarea programada que envía los recordatorios y avisos de vencimiento.
 * ALERTAS_HORARIO cambia el horario (expresión cron, hora de Colombia) y
 * ALERTAS_ACTIVAS=false la apaga (p. ej. si hay varias copias del backend).
 */
@Injectable()
export class AlertasPrestamoTarea implements OnApplicationBootstrap {
  private readonly logger = new Logger('AlertasPrestamo');
  private enCurso = false;

  constructor(
    private readonly enviarAlertas: EnviarAlertasPrestamoUseCase,
    private readonly config: ConfigService,
    private readonly registro: SchedulerRegistry,
  ) {}

  onApplicationBootstrap(): void {
    if (this.config.get<string>('ALERTAS_ACTIVAS') === 'false') {
      this.logger.log(
        'Alertas de préstamo desactivadas (ALERTAS_ACTIVAS=false)',
      );
      return;
    }
    const horario = this.horario();
    const tarea = CronJob.from({
      cronTime: horario,
      timeZone: ZONA_HORARIA,
      onTick: () => void this.ejecutar(),
    });
    this.registro.addCronJob(NOMBRE, tarea);
    tarea.start();
    this.logger.log(
      `Alertas de préstamo programadas con «${horario}» (hora de Colombia)`,
    );
  }

  /** Un horario mal escrito no debe tumbar la API: se avisa y se usa el de por defecto. */
  private horario(): string {
    const configurado = this.config.get<string>('ALERTAS_HORARIO')?.trim();
    if (!configurado) return HORARIO_POR_DEFECTO;
    try {
      CronJob.from({ cronTime: configurado, onTick: () => undefined });
      return configurado;
    } catch {
      this.logger.error(
        `ALERTAS_HORARIO no es una expresión cron válida («${configurado}»); se usa «${HORARIO_POR_DEFECTO}»`,
      );
      return HORARIO_POR_DEFECTO;
    }
  }

  /** No se solapa con sí misma si un envío se demora más que el intervalo. */
  async ejecutar(): Promise<ResultadoAlertas | null> {
    if (this.enCurso) return null;
    this.enCurso = true;
    try {
      const resultado = await this.enviarAlertas.execute();
      registrarResultado(this.logger, resultado);
      return resultado;
    } catch (error) {
      this.logger.error(
        'La tarea de alertas de préstamo falló',
        error instanceof Error ? error.stack : String(error),
      );
      return null;
    } finally {
      this.enCurso = false;
    }
  }
}

/** Resumen en el log, sin correos ni nombres (solo ids de préstamo). */
export function registrarResultado(
  logger: Logger,
  { hoy, recordatorios, vencimientos, fallos }: ResultadoAlertas,
): void {
  logger.log(
    `Alertas de préstamo del ${hoy}: ${recordatorios} recordatorios y ${vencimientos} avisos de vencimiento enviados, ${fallos.length} fallidos`,
  );
  for (const f of fallos) {
    logger.warn(
      `No se pudo enviar la alerta ${f.tipo} del préstamo ${f.prestamoId}: ${f.motivo}`,
    );
  }
}
