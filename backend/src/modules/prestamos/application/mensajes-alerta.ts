import { MensajeCorreo } from '../../../shared/domain/correo';
import { diasEntre } from '../domain/fecha-calendario';
import {
  PrestamoParaAlerta,
  TipoAlerta,
} from '../domain/repositories/alerta-prestamo.repository';

const FECHA_LARGA = new Intl.DateTimeFormat('es-CO', {
  timeZone: 'UTC',
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

/** «2026-11-25» → «martes 25 de noviembre de 2026». */
export function fechaLarga(fecha: string): string {
  return FECHA_LARGA.format(new Date(`${fecha}T00:00:00Z`)).replace(',', '');
}

const dias = (n: number) => (n === 1 ? '1 día' : `${n} días`);

function cuandoVence(diasRestantes: number): string {
  if (diasRestantes <= 0) return 'hoy';
  if (diasRestantes === 1) return 'mañana';
  return `en ${dias(diasRestantes)}`;
}

const PIE = [
  '',
  'Si ya lo devolviste, no tienes que hacer nada.',
  '',
  'Biblioteca del CLENA',
  'Este es un mensaje automático; por favor no lo respondas.',
];

/** HU-29: texto del correo de recordatorio o de vencimiento, en español y en texto plano. */
export function mensajeAlerta(
  tipo: TipoAlerta,
  p: PrestamoParaAlerta,
  hoy: string,
): MensajeCorreo {
  const libro = `«${p.libroTitulo}» (ejemplar ${p.codigoInventario})`;
  const fecha = fechaLarga(p.fechaLimite);

  if (tipo === 'RECORDATORIO') {
    const cuando = cuandoVence(diasEntre(hoy, p.fechaLimite));
    return {
      para: p.usuario.email,
      asunto: `Recordatorio: tu préstamo de «${p.libroTitulo}» vence ${cuando}`,
      texto: [
        `Hola, ${p.usuario.nombre}:`,
        '',
        `Te recordamos que el préstamo de ${libro} vence ${cuando}, el ${fecha}.`,
        'Puedes devolverlo en la biblioteca del CLENA hasta el final de ese día.',
        ...PIE,
      ].join('\n'),
    };
  }

  const retraso = dias(Math.max(1, diasEntre(p.fechaLimite, hoy)));
  return {
    para: p.usuario.email,
    asunto: `Tu préstamo de «${p.libroTitulo}» está vencido`,
    texto: [
      `Hola, ${p.usuario.nombre}:`,
      '',
      `El préstamo de ${libro} venció el ${fecha} y lleva ${retraso} de retraso.`,
      'Por favor, devuélvelo en la biblioteca del CLENA lo antes posible para que otras personas puedan usarlo.',
      ...PIE,
    ].join('\n'),
  };
}
