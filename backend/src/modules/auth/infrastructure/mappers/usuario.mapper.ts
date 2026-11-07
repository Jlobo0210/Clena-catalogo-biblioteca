import { Prisma, Usuario as UsuarioPrisma } from '@prisma/client';
import { Usuario } from '../../domain/entities/usuario';
import { Email } from '../../domain/value-objects/email';

/** Traduce entre el modelo de Prisma y la entidad de dominio. El modelo de Prisma no sale de aquí. */
export const UsuarioMapper = {
  toDomain(row: UsuarioPrisma): Usuario {
    return Usuario.reconstruir({
      id: row.id,
      nombre: row.nombre,
      email: Email.crear(row.email),
      passwordHash: row.passwordHash,
      rol: row.rol,
      consentimientoPrivacidadEn: row.consentimientoPrivacidadEn,
      versionAvisoPrivacidad: row.versionAvisoPrivacidad,
      anonimizadoEn: row.anonimizadoEn,
      creadoEn: row.creadoEn,
    });
  },

  toPersistence(u: Usuario): Prisma.UsuarioUncheckedCreateInput {
    return {
      id: u.id,
      nombre: u.nombre,
      email: u.email.valor,
      passwordHash: u.passwordHash,
      rol: u.rol,
      consentimientoPrivacidadEn: u.consentimientoPrivacidadEn,
      versionAvisoPrivacidad: u.versionAvisoPrivacidad,
      anonimizadoEn: u.anonimizadoEn,
      creadoEn: u.creadoEn,
    };
  },
};
