/**
 * Aviso de privacidad vigente (Ley 1581 de 2012). Al registrarse, el usuario acepta esta versión
 * y se guarda junto con la fecha del consentimiento. Si el texto cambia, se sube la versión.
 * Texto provisional: debe revisarlo el CLENA antes del despliegue.
 */
export const AVISO_PRIVACIDAD = {
  version: '1.0',
  responsable: 'Biblioteca del CLENA, Barranquilla',
  datosRecolectados: [
    'Nombre',
    'Correo electrónico',
    'Contraseña (guardada cifrada)',
  ],
  finalidades: [
    'Crear y administrar tu cuenta en el catálogo de la biblioteca.',
    'Registrar tus préstamos y enviarte avisos de devolución y disponibilidad.',
  ],
  derechos:
    'Puedes conocer, actualizar y rectificar tus datos, revocar la autorización y pedir la eliminación de tu cuenta en cualquier momento.',
  texto:
    'Al crear tu cuenta autorizas a la Biblioteca del CLENA a tratar tu nombre y tu correo electrónico solo para administrar tu cuenta, tus préstamos y los avisos relacionados. No compartimos tus datos con terceros. Puedes conocer, actualizar, rectificar o eliminar tus datos y revocar esta autorización en cualquier momento.',
} as const;
