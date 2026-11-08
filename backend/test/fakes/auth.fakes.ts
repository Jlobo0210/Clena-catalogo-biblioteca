/** Implementaciones en memoria de los puertos de auth, para pruebas unitarias y e2e (sin base de datos). */
import { RefreshToken } from '../../src/modules/auth/domain/entities/refresh-token';
import { Usuario } from '../../src/modules/auth/domain/entities/usuario';
import { RefreshTokenRepository } from '../../src/modules/auth/domain/repositories/refresh-token.repository';
import {
  FiltroUsuarios,
  UsuarioRepository,
} from '../../src/modules/auth/domain/repositories/usuario.repository';
import { PasswordHasher } from '../../src/modules/auth/domain/services/password-hasher';
import {
  AccessTokenPayload,
  TokenService,
} from '../../src/modules/auth/domain/services/token-service';
import { Email } from '../../src/modules/auth/domain/value-objects/email';
import { Rol } from '../../src/modules/auth/domain/value-objects/rol';
import { IdGenerator } from '../../src/shared/domain/id-generator';

export class UsuariosEnMemoria implements UsuarioRepository {
  readonly filas = new Map<string, Usuario>();

  guardar(u: Usuario): Promise<void> {
    this.filas.set(u.id, u);
    return Promise.resolve();
  }
  buscarPorId(id: string): Promise<Usuario | null> {
    return Promise.resolve(this.filas.get(id) ?? null);
  }
  buscarPorEmail(email: string): Promise<Usuario | null> {
    return Promise.resolve(
      [...this.filas.values()].find((u) => u.email.valor === email) ?? null,
    );
  }
  listar(f: FiltroUsuarios): Promise<{ items: Usuario[]; total: number }> {
    const todos = [...this.filas.values()].filter(
      (u) =>
        (!f.rol || u.rol === f.rol) &&
        (!f.texto ||
          u.nombre.toLowerCase().includes(f.texto.toLowerCase()) ||
          u.email.valor.includes(f.texto.toLowerCase())),
    );
    const inicio = (f.pagina - 1) * f.tamano;
    return Promise.resolve({
      items: todos.slice(inicio, inicio + f.tamano),
      total: todos.length,
    });
  }
}

export class RefreshTokensEnMemoria implements RefreshTokenRepository {
  readonly filas = new Map<string, RefreshToken>();

  guardar(t: RefreshToken): Promise<void> {
    this.filas.set(t.id, { ...t });
    return Promise.resolve();
  }
  buscarPorHash(h: string): Promise<RefreshToken | null> {
    const t = [...this.filas.values()].find((x) => x.tokenHash === h);
    return Promise.resolve(t ? { ...t } : null);
  }
  revocar(id: string, cuando: Date): Promise<void> {
    const t = this.filas.get(id);
    if (t && t.revocadoEn === null) t.revocadoEn = cuando;
    return Promise.resolve();
  }
  revocarTodosDe(usuarioId: string, cuando: Date): Promise<void> {
    for (const t of this.filas.values()) {
      if (t.usuarioId === usuarioId && t.revocadoEn === null)
        t.revocadoEn = cuando;
    }
    return Promise.resolve();
  }
}

/** "Hash" reversible solo para pruebas: no usar fuera de test/. */
export class HasherFalso implements PasswordHasher {
  hash(p: string): Promise<string> {
    return Promise.resolve(`hash:${p}`);
  }
  comparar(p: string, h: string): Promise<boolean> {
    return Promise.resolve(h === `hash:${p}`);
  }
}

export class TokensFalsos implements TokenService {
  readonly accessTtlSegundos = 900;
  readonly refreshTtlDias = 7;
  private n = 0;

  firmarAccess(p: AccessTokenPayload): Promise<string> {
    return Promise.resolve(`access.${p.sub}.${p.rol}`);
  }
  verificarAccess(token: string): Promise<AccessTokenPayload | null> {
    const [tipo, sub, rol] = token.split('.');
    return Promise.resolve(
      tipo === 'access' ? { sub, email: '', rol: rol as Rol } : null,
    );
  }
  generarRefresh(): string {
    return `refresh-${++this.n}`;
  }
  hashRefresh(t: string): string {
    return `sha:${t}`;
  }
}

export class IdsSecuenciales implements IdGenerator {
  private n = 0;
  generate(): string {
    return `id-${++this.n}`;
  }
}

export function usuarioDePrueba(
  datos: Partial<{
    id: string;
    email: string;
    rol: Rol;
    password: string | null;
    anonimizadoEn: Date | null;
  }> = {},
): Usuario {
  return Usuario.reconstruir({
    id: datos.id ?? 'u-1',
    nombre: 'Persona de prueba',
    email: Email.crear(datos.email ?? 'persona@example.com'),
    passwordHash:
      datos.password === null ? null : `hash:${datos.password ?? 'clave-123'}`,
    rol: datos.rol ?? Rol.PUBLICO,
    consentimientoPrivacidadEn: new Date('2026-11-01T00:00:00Z'),
    versionAvisoPrivacidad: '1.0',
    anonimizadoEn: datos.anonimizadoEn ?? null,
    creadoEn: new Date('2026-11-01T00:00:00Z'),
  });
}
