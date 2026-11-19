import { ServicioCorreo } from '../../../../shared/domain/correo';
import { SuscripcionDisponibilidadRepository } from '../../domain/suscripcion-disponibilidad.repository';
import { mensajeDisponibilidad } from '../mensajes-disponibilidad';

export interface DatosNotificacion {
  libroId: string;
  tituloLibro: string;
  /** Función para obtener email y nombre de un usuario */
  obtenerUsuario: (
    usuarioId: string,
  ) => Promise<{ nombre: string; email: string } | null>;
}

export class NotificarSuscriptoresUseCase {
  constructor(
    private readonly suscripciones: SuscripcionDisponibilidadRepository,
    private readonly correo: ServicioCorreo,
    private readonly reloj: () => Date = () => new Date(),
  ) {}

  async execute(datos: DatosNotificacion): Promise<void> {
    const { libroId, tituloLibro, obtenerUsuario } = datos;
    const activas = await this.suscripciones.buscarActivasPorLibro(libroId);

    if (activas.length === 0) return;

    const ahora = this.reloj();

    await Promise.all(
      activas.map(async (suscripcion) => {
        try {
          const usuario = await obtenerUsuario(suscripcion.usuarioId);
          if (!usuario) return;

          const { asunto, texto } = mensajeDisponibilidad({
            nombreUsuario: usuario.nombre,
            tituloLibro,
            ahora,
          });

          await this.correo.enviar({ para: usuario.email, asunto, texto });

          suscripcion.marcarNotificada(ahora);
          await this.suscripciones.actualizar(suscripcion);
        } catch {
          // Si falla una notificación no queremos abortar las demás
        }
      }),
    );
  }
}
