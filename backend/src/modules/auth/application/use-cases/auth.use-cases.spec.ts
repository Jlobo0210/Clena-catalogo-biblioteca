import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '../../../../shared/domain/domain-error';
import {
  HasherFalso,
  IdsSecuenciales,
  RefreshTokensEnMemoria,
  TokensFalsos,
  UsuariosEnMemoria,
  usuarioDePrueba,
} from '../../../../../test/fakes/auth.fakes';
import { Rol } from '../../domain/value-objects/rol';
import { CambiarRolUseCase } from './cambiar-rol.use-case';
import { CerrarSesionUseCase } from './cerrar-sesion.use-case';
import { EmisorSesion } from './emisor-sesion';
import {
  CREDENCIALES_INVALIDAS,
  IniciarSesionUseCase,
} from './iniciar-sesion.use-case';
import { ListarUsuariosUseCase } from './listar-usuarios.use-case';
import { ObtenerPerfilUseCase } from './obtener-perfil.use-case';
import { RefrescarSesionUseCase } from './refrescar-sesion.use-case';
import { RegistrarUsuarioUseCase } from './registrar-usuario.use-case';

const AHORA = new Date('2026-11-07T10:00:00Z');
const reloj = () => AHORA;

function montar() {
  const usuarios = new UsuariosEnMemoria();
  const refresh = new RefreshTokensEnMemoria();
  const tokens = new TokensFalsos();
  const hasher = new HasherFalso();
  const ids = new IdsSecuenciales();
  const emisor = new EmisorSesion(tokens, refresh, ids);
  return {
    usuarios,
    refresh,
    tokens,
    registrar: new RegistrarUsuarioUseCase(
      usuarios,
      hasher,
      emisor,
      ids,
      reloj,
    ),
    login: new IniciarSesionUseCase(usuarios, hasher, emisor, reloj),
    refrescar: new RefrescarSesionUseCase(
      refresh,
      usuarios,
      tokens,
      emisor,
      reloj,
    ),
    cerrar: new CerrarSesionUseCase(refresh, tokens, reloj),
    perfil: new ObtenerPerfilUseCase(usuarios),
    listar: new ListarUsuariosUseCase(usuarios),
    cambiarRol: new CambiarRolUseCase(usuarios),
  };
}

const registro = {
  nombre: 'Ana Pérez',
  email: 'Ana@Example.com',
  password: 'clave-segura-1',
  aceptaAvisoPrivacidad: true,
};

describe('RegistrarUsuarioUseCase (HU-11)', () => {
  it('crea un usuario público con consentimiento y devuelve la sesión', async () => {
    const s = montar();
    const sesion = await s.registrar.execute(registro);

    expect(sesion.usuario).toMatchObject({
      email: 'ana@example.com',
      rol: Rol.PUBLICO,
      versionAvisoPrivacidad: '1.0',
      consentimientoPrivacidadEn: AHORA.toISOString(),
    });
    expect(sesion.accessToken).toContain('PUBLICO');
    expect(sesion.tokenType).toBe('Bearer');
    const guardado = await s.usuarios.buscarPorEmail('ana@example.com');
    expect(guardado?.passwordHash).toBe('hash:clave-segura-1'); // nunca en texto plano
    expect(s.refresh.filas.size).toBe(1);
  });

  it('rechaza el registro sin aceptar el aviso de privacidad', async () => {
    const s = montar();
    await expect(
      s.registrar.execute({ ...registro, aceptaAvisoPrivacidad: false }),
    ).rejects.toThrow(ValidationError);
    expect(s.usuarios.filas.size).toBe(0);
  });

  it('rechaza un correo ya registrado', async () => {
    const s = montar();
    await s.registrar.execute(registro);
    await expect(
      s.registrar.execute({ ...registro, email: 'ana@example.com ' }),
    ).rejects.toThrow(ConflictError);
  });

  it('rechaza una contraseña débil', async () => {
    const s = montar();
    await expect(
      s.registrar.execute({ ...registro, password: 'abcdefgh' }),
    ).rejects.toThrow(ValidationError);
  });
});

describe('IniciarSesionUseCase (HU-12)', () => {
  it('devuelve access y refresh token con credenciales válidas', async () => {
    const s = montar();
    await s.usuarios.guardar(usuarioDePrueba({ rol: Rol.PERSONAL }));
    const sesion = await s.login.execute({
      email: ' PERSONA@example.com',
      password: 'clave-123',
    });
    expect(sesion.accessToken).toBe('access.u-1.PERSONAL');
    expect(sesion.refreshToken).toBe('refresh-1');
    expect(sesion.expiresIn).toBe(900);
    const [guardado] = [...s.refresh.filas.values()];
    expect(guardado.tokenHash).toBe('sha:refresh-1');
    expect(guardado.expiraEn).toEqual(new Date('2026-11-14T10:00:00Z'));
  });

  it('responde 401 con el mismo mensaje si el correo no existe o la clave es errada', async () => {
    const s = montar();
    await s.usuarios.guardar(usuarioDePrueba());
    await expect(
      s.login.execute({ email: 'otro@example.com', password: 'clave-123' }),
    ).rejects.toThrow(new UnauthorizedError(CREDENCIALES_INVALIDAS));
    await expect(
      s.login.execute({ email: 'persona@example.com', password: 'mala-1234' }),
    ).rejects.toThrow(new UnauthorizedError(CREDENCIALES_INVALIDAS));
  });

  it('no deja entrar a una cuenta anonimizada', async () => {
    const s = montar();
    await s.usuarios.guardar(
      usuarioDePrueba({ password: null, anonimizadoEn: AHORA }),
    );
    await expect(
      s.login.execute({ email: 'persona@example.com', password: 'clave-123' }),
    ).rejects.toThrow(UnauthorizedError);
  });
});

describe('RefrescarSesionUseCase y CerrarSesionUseCase (HU-12)', () => {
  async function conSesion() {
    const s = montar();
    await s.usuarios.guardar(usuarioDePrueba());
    const sesion = await s.login.execute({
      email: 'persona@example.com',
      password: 'clave-123',
    });
    return { s, sesion };
  }

  it('rota el refresh token: el viejo queda revocado y llega uno nuevo', async () => {
    const { s, sesion } = await conSesion();
    const nueva = await s.refrescar.execute(sesion.refreshToken);
    expect(nueva.refreshToken).not.toBe(sesion.refreshToken);
    const viejo = await s.refresh.buscarPorHash(`sha:${sesion.refreshToken}`);
    expect(viejo?.revocadoEn).toEqual(AHORA);
  });

  it('si se reutiliza un refresh token revocado, cierra todas las sesiones', async () => {
    const { s, sesion } = await conSesion();
    const nueva = await s.refrescar.execute(sesion.refreshToken);
    await expect(s.refrescar.execute(sesion.refreshToken)).rejects.toThrow(
      UnauthorizedError,
    );
    await expect(s.refrescar.execute(nueva.refreshToken)).rejects.toThrow(
      UnauthorizedError,
    );
  });

  it('rechaza tokens desconocidos o vencidos', async () => {
    const { s, sesion } = await conSesion();
    await expect(s.refrescar.execute('inventado')).rejects.toThrow(
      UnauthorizedError,
    );
    const vencido = new RefrescarSesionUseCase(
      s.refresh,
      s.usuarios,
      s.tokens,
      new EmisorSesion(s.tokens, s.refresh, new IdsSecuenciales()),
      () => new Date('2026-12-01T00:00:00Z'),
    );
    await expect(vencido.execute(sesion.refreshToken)).rejects.toThrow(
      UnauthorizedError,
    );
  });

  it('rechaza el refresh si el usuario ya no puede iniciar sesión', async () => {
    const { s, sesion } = await conSesion();
    await s.usuarios.guardar(
      usuarioDePrueba({ password: null, anonimizadoEn: AHORA }),
    );
    await expect(s.refrescar.execute(sesion.refreshToken)).rejects.toThrow(
      UnauthorizedError,
    );
  });

  it('el logout invalida el refresh token y es idempotente', async () => {
    const { s, sesion } = await conSesion();
    await s.cerrar.execute(sesion.refreshToken);
    await s.cerrar.execute(sesion.refreshToken);
    await s.cerrar.execute('no-existe');
    await expect(s.refrescar.execute(sesion.refreshToken)).rejects.toThrow(
      UnauthorizedError,
    );
  });
});

describe('Perfil y administración de usuarios (HU-13)', () => {
  it('obtiene el perfil o responde 404', async () => {
    const s = montar();
    await s.usuarios.guardar(usuarioDePrueba());
    await expect(s.perfil.execute('u-1')).resolves.toMatchObject({
      email: 'persona@example.com',
    });
    await expect(s.perfil.execute('nadie')).rejects.toThrow(NotFoundError);
  });

  it('lista paginado y filtra por rol y texto', async () => {
    const s = montar();
    for (let i = 1; i <= 25; i++) {
      await s.usuarios.guardar(
        usuarioDePrueba({
          id: `u-${i}`,
          email: `p${i}@example.com`,
          rol: i <= 2 ? Rol.PERSONAL : Rol.PUBLICO,
        }),
      );
    }
    const p2 = await s.listar.execute({ pagina: 2 });
    expect(p2).toMatchObject({ total: 25, pagina: 2, tamano: 20 });
    expect(p2.items).toHaveLength(5);

    const personal = await s.listar.execute({ rol: Rol.PERSONAL });
    expect(personal.total).toBe(2);

    const texto = await s.listar.execute({ texto: ' p25@ ', tamano: 500 });
    expect(texto.total).toBe(1);
    expect(texto.tamano).toBe(100);

    const defecto = await s.listar.execute();
    expect(defecto.pagina).toBe(1);
  });

  it('el administrador cambia el rol de otro usuario', async () => {
    const s = montar();
    await s.usuarios.guardar(usuarioDePrueba({ id: 'u-2' }));
    const r = await s.cambiarRol.execute({
      usuarioId: 'u-2',
      rol: Rol.PERSONAL,
      solicitadoPor: 'admin',
    });
    expect(r.rol).toBe(Rol.PERSONAL);
  });

  it('no permite cambiar el propio rol, un rol inválido ni un usuario inexistente', async () => {
    const s = montar();
    await s.usuarios.guardar(usuarioDePrueba({ id: 'admin' }));
    await expect(
      s.cambiarRol.execute({
        usuarioId: 'admin',
        rol: Rol.PUBLICO,
        solicitadoPor: 'admin',
      }),
    ).rejects.toThrow('No puedes cambiar tu propio rol');
    await expect(
      s.cambiarRol.execute({
        usuarioId: 'admin',
        rol: 'ROOT' as Rol,
        solicitadoPor: 'otro',
      }),
    ).rejects.toThrow(ValidationError);
    await expect(
      s.cambiarRol.execute({
        usuarioId: 'nadie',
        rol: Rol.PUBLICO,
        solicitadoPor: 'admin',
      }),
    ).rejects.toThrow(NotFoundError);
  });
});
