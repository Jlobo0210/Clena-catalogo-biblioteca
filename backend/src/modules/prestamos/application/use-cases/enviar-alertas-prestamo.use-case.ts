import { ServicioCorreo } from '../../../../shared/domain/correo';
import { fechaEnColombia, sumarDias } from '../../domain/fecha-calendario';
import {
  AlertaPrestamoRepository,
  PrestamoParaAlerta,
  TipoAlerta,
} from '../../domain/repositories/alerta-prestamo.repository';
import { mensajeAlerta } from '../mensajes-alerta';
import { PoliticaAlertas } from '../politica-alertas';

/** Algunos errores de red llegan sin mensaje (p. ej. ECONNREFUSED): se usa el código. */
function motivoDe(error: unknown): string {
  if (!(error instanceof Error)) return String(error);
  const { code } = error as { code?: unknown };
  return error.message || (typeof code === 'string' ? code : error.name);
}

export interface FalloAlerta {
  prestamoId: string;
  tipo: TipoAlerta;
  motivo: string;
}

export interface ResultadoAlertas {
  /** Hoy en Colombia («YYYY-MM-DD»). */
  hoy: string;
  recordatorios: number;
  vencimientos: number;
  /** Envíos que fallaron: quedan pendientes para la próxima ejecución. */
  fallos: FalloAlerta[];
}

/**
 * HU-29: la tarea programada envía un recordatorio a quien tiene un préstamo que vence en
 * los próximos N días (ALERTA_DIAS_ANTES) y un aviso cuando el préstamo ya venció.
 * Cada alerta se envía una sola vez por préstamo (R14), aunque la tarea corra varias veces:
 * si un día no corre, al día siguiente envía lo que quedó pendiente.
 */
export class EnviarAlertasPrestamoUseCase {
  constructor(
    private readonly alertas: AlertaPrestamoRepository,
    private readonly correo: ServicioCorreo,
    private readonly politica: PoliticaAlertas,
    private readonly reloj: () => Date = () => new Date(),
  ) {}

  async execute(): Promise<ResultadoAlertas> {
    const hoy = fechaEnColombia(this.reloj());
    const resultado: ResultadoAlertas = {
      hoy,
      recordatorios: 0,
      vencimientos: 0,
      fallos: [],
    };

    const porVencer = await this.alertas.pendientes('RECORDATORIO', {
      desde: hoy,
      hasta: sumarDias(hoy, this.politica.diasAntes),
    });
    resultado.recordatorios = await this.enviar(
      'RECORDATORIO',
      porVencer,
      hoy,
      resultado.fallos,
    );

    // R9: vencido = la fecha límite ya pasó (hoy > fechaLimite).
    const vencidos = await this.alertas.pendientes('VENCIMIENTO', {
      hasta: sumarDias(hoy, -1),
    });
    resultado.vencimientos = await this.enviar(
      'VENCIMIENTO',
      vencidos,
      hoy,
      resultado.fallos,
    );

    return resultado;
  }

  private async enviar(
    tipo: TipoAlerta,
    prestamos: PrestamoParaAlerta[],
    hoy: string,
    fallos: FalloAlerta[],
  ): Promise<number> {
    let enviados = 0;
    // Uno por uno: los servidores SMTP limitan los envíos simultáneos.
    for (const p of prestamos) {
      const reservada = await this.alertas.reservar(
        p.prestamoId,
        tipo,
        this.reloj(),
      );
      if (!reservada) continue;
      try {
        await this.correo.enviar(mensajeAlerta(tipo, p, hoy));
        enviados++;
      } catch (error) {
        await this.alertas.liberar(p.prestamoId, tipo);
        fallos.push({
          prestamoId: p.prestamoId,
          tipo,
          motivo: motivoDe(error),
        });
      }
    }
    return enviados;
  }
}
