function fechaLarga(fecha: Date): string {
  return fecha.toLocaleDateString('es-CO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

const PIE =
  '\n\n──────────────────────────────\n' +
  'Biblioteca CLENA · Sistema de catálogo en línea\n' +
  'Este mensaje es generado automáticamente, por favor no responder.';

export function mensajeDisponibilidad(params: {
  nombreUsuario: string;
  tituloLibro: string;
  ahora: Date;
}): { asunto: string; texto: string } {
  const { nombreUsuario, tituloLibro, ahora } = params;
  const asunto = `¡"${tituloLibro}" está disponible!`;
  const texto =
    `Hola ${nombreUsuario},\n\n` +
    `Nos complace informarte que el libro "${tituloLibro}" que solicitaste ` +
    `volver a tener disponible ya puede ser consultado o prestado en la biblioteca.\n\n` +
    `Fecha de disponibilidad: ${fechaLarga(ahora)}\n\n` +
    `Te recordamos que la disponibilidad puede cambiar, por lo que te recomendamos ` +
    `acercarte pronto a la biblioteca.\n\n` +
    `Si ya no estás interesado/a en este libro, puedes ignorar este mensaje.` +
    PIE;
  return { asunto, texto };
}
