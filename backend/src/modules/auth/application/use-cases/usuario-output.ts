import { Usuario } from '../../domain/entities/usuario';
import { UsuarioOutput } from '../dtos/auth.dto';

export function aUsuarioOutput(u: Usuario): UsuarioOutput {
  return {
    id: u.id,
    nombre: u.nombre,
    email: u.email.valor,
    rol: u.rol,
    consentimientoPrivacidadEn: u.consentimientoPrivacidadEn.toISOString(),
    versionAvisoPrivacidad: u.versionAvisoPrivacidad,
    creadoEn: u.creadoEn.toISOString(),
  };
}
