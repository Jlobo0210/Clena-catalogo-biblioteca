import {
  HasherFalso,
  UsuariosEnMemoria,
  usuarioDePrueba,
} from '../../../../../test/fakes/auth.fakes';
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from '../../../../shared/domain/domain-error';
import { Usuario } from '../../domain/entities/usuario';
import { Rol } from '../../domain/value-objects/rol';
import { EliminarCuentaUseCase } from './eliminar-cuenta.use-case';

const AHORA = new Date('2026-11-13T15:00:00Z');

function montar() {
  const usuarios = new UsuariosEnMemoria();
  const caso = new EliminarCuentaUseCase(
    usuarios,
    new HasherFalso(),
    () => AHORA,
  );
  return { usuarios, caso };
}

describe('EliminarCuentaUseCase (HU-34)', () => {
  it('anonimiza los datos personales y conserva la fila', async () => {
    const { usuarios, caso } = montar();
    await usuarios.guardar(usuarioDePrueba());

    await caso.execute('u-1', { password: 'clave-123' });

    const u = await usuarios.buscarPorId('u-1');
    expect(u?.nombre).toBe(Usuario.NOMBRE_ANONIMO);
    expect(u?.email.valor).toBe('eliminado-u-1@anonimo.invalid');
    expect(u?.passwordHash).toBeNull();
    expect(u?.anonimizadoEn).toEqual(AHORA);
    expect(u?.puedeIniciarSesion).toBe(false);
    expect(usuarios.anonimizados).toEqual(['u-1']);
  });

  it('pide la contraseña correcta (400)', async () => {
    const { usuarios, caso } = montar();
    await usuarios.guardar(usuarioDePrueba());
    await expect(
      caso.execute('u-1', { password: 'otra-1234' }),
    ).rejects.toThrow(new ValidationError('La contraseña no es correcta'));
    expect(usuarios.anonimizados).toEqual([]);
  });

  it('no deja eliminar la cuenta con préstamos sin devolver (409)', async () => {
    const { usuarios, caso } = montar();
    await usuarios.guardar(usuarioDePrueba());
    usuarios.prestamosSinDevolver.set('u-1', 2);
    await expect(
      caso.execute('u-1', { password: 'clave-123' }),
    ).rejects.toThrow(/Tienes 2 préstamo\(s\) sin devolver/);
    expect(usuarios.anonimizados).toEqual([]);
  });

  it('una cuenta de administración no se elimina sola (409)', async () => {
    const { usuarios, caso } = montar();
    await usuarios.guardar(usuarioDePrueba({ rol: Rol.ADMINISTRADOR }));
    await expect(
      caso.execute('u-1', { password: 'clave-123' }),
    ).rejects.toThrow(ConflictError);
  });

  it('una cuenta inexistente o ya eliminada responde 404', async () => {
    const { usuarios, caso } = montar();
    await expect(caso.execute('nadie', { password: 'x' })).rejects.toThrow(
      NotFoundError,
    );
    await usuarios.guardar(
      usuarioDePrueba({ password: null, anonimizadoEn: AHORA }),
    );
    await expect(caso.execute('u-1', { password: 'x' })).rejects.toThrow(
      NotFoundError,
    );
  });
});
