/** HU-29: alertas y correo en memoria, para pruebas unitarias y e2e (sin base ni SMTP). */
import { MensajeCorreo, ServicioCorreo } from '../../src/shared/domain/correo';
import {
  AlertaPrestamoRepository,
  PrestamoParaAlerta,
  RangoFechaLimite,
  TipoAlerta,
} from '../../src/modules/prestamos/domain/repositories/alerta-prestamo.repository';
import { PrestamosEnMemoria } from './prestamos.fakes';

/** Lee los préstamos de un PrestamosEnMemoria y guarda las alertas enviadas. */
export class AlertasEnMemoria implements AlertaPrestamoRepository {
  /** «prestamoId:TIPO» → fecha de envío. */
  readonly enviadas = new Map<string, Date>();
  /** Usuarios anonimizados (HU-34): no reciben alertas. */
  readonly anonimizados = new Set<string>();

  constructor(private readonly prestamos: PrestamosEnMemoria) {}

  pendientes(
    tipo: TipoAlerta,
    { desde, hasta }: RangoFechaLimite,
  ): Promise<PrestamoParaAlerta[]> {
    const items = [...this.prestamos.filas.values()]
      .filter(
        (p) =>
          !p.fechaDevolucion &&
          (!desde || p.fechaLimite >= desde) &&
          (!hasta || p.fechaLimite <= hasta) &&
          !this.enviadas.has(`${p.id}:${tipo}`) &&
          !this.anonimizados.has(p.usuarioId),
      )
      .sort(
        (a, b) =>
          a.fechaLimite.localeCompare(b.fechaLimite) ||
          a.id.localeCompare(b.id),
      )
      .map((p) => {
        const ejemplar = this.prestamos.ejemplares.get(p.ejemplarId)!;
        const usuario = this.prestamos.usuarios.get(p.usuarioId)!;
        return {
          prestamoId: p.id,
          fechaLimite: p.fechaLimite,
          usuario: { nombre: usuario.nombre, email: usuario.email },
          libroTitulo: ejemplar.libroTitulo,
          codigoInventario: ejemplar.codigoInventario,
        };
      });
    return Promise.resolve(items);
  }

  reservar(
    prestamoId: string,
    tipo: TipoAlerta,
    enviadaEn: Date,
  ): Promise<boolean> {
    const clave = `${prestamoId}:${tipo}`;
    if (this.enviadas.has(clave)) return Promise.resolve(false);
    this.enviadas.set(clave, enviadaEn);
    return Promise.resolve(true);
  }

  liberar(prestamoId: string, tipo: TipoAlerta): Promise<void> {
    this.enviadas.delete(`${prestamoId}:${tipo}`);
    return Promise.resolve();
  }
}

/** Guarda los correos en vez de enviarlos; puede fallar para un destinatario. */
export class CorreoFalso implements ServicioCorreo {
  readonly enviados: MensajeCorreo[] = [];
  readonly fallarPara = new Set<string>();

  enviar(mensaje: MensajeCorreo): Promise<void> {
    if (this.fallarPara.has(mensaje.para)) {
      return Promise.reject(new Error('Servidor de correo no disponible'));
    }
    this.enviados.push(mensaje);
    return Promise.resolve();
  }

  para(email: string): MensajeCorreo[] {
    return this.enviados.filter((m) => m.para === email);
  }
}

/** HU-30: suscripciones de disponibilidad en memoria. */
import { SuscripcionDisponibilidad } from '../../src/modules/suscripciones/domain/suscripcion-disponibilidad.entity';
import { SuscripcionDisponibilidadRepository } from '../../src/modules/suscripciones/domain/suscripcion-disponibilidad.repository';

export class SuscripcionesEnMemoria implements SuscripcionDisponibilidadRepository {
  readonly store = new Map<string, SuscripcionDisponibilidad>();

  async buscarActiva(usuarioId: string, libroId: string) {
    for (const s of this.store.values()) {
      if (s.usuarioId === usuarioId && s.libroId === libroId && s.activa) return s;
    }
    return null;
  }

  async buscarActivasPorLibro(libroId: string) {
    return [...this.store.values()].filter((s) => s.libroId === libroId && s.activa);
  }

  async buscarPorId(id: string) {
    return this.store.get(id) ?? null;
  }

  async guardar(s: SuscripcionDisponibilidad) {
    this.store.set(s.id, s);
  }

  async actualizar(s: SuscripcionDisponibilidad) {
    this.store.set(s.id, s);
  }
}
