import { useCallback, useEffect, useState } from 'react';
import { normalizarError } from '../../api/errores';
import { cambiarRol, listarUsuarios } from '../auth/api/auth.api';
import { useSesion } from '../auth/sesion/contextoSesion';
import { NOMBRE_ROL, type Rol, type Usuario } from '../auth/types';
import styles from './UsuariosPage.module.css';

const ROLES: Rol[] = ['PUBLICO', 'PERSONAL', 'ADMINISTRADOR'];

/** Lista de cuentas y cambio de rol (solo administración, HU-13). */
export function UsuariosPage() {
  const { usuario: yo } = useSesion();
  const [usuarios, setUsuarios] = useState<Usuario[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [guardando, setGuardando] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    try {
      const pagina = await listarUsuarios(1, 100);
      setUsuarios(pagina.items);
      setError(null);
    } catch (e) {
      setError(normalizarError(e).mensaje);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const actualizarRol = async (usuario: Usuario, rol: Rol) => {
    setGuardando(usuario.id);
    setAviso(null);
    try {
      const actualizado = await cambiarRol(usuario.id, rol);
      setUsuarios((lista) => lista?.map((u) => (u.id === actualizado.id ? actualizado : u)) ?? null);
      setAviso(`${actualizado.nombre} ahora tiene el rol ${NOMBRE_ROL[actualizado.rol]}.`);
    } catch (e) {
      setAviso(`No se pudo cambiar el rol: ${normalizarError(e).mensaje}`);
    } finally {
      setGuardando(null);
    }
  };

  return (
    <section aria-labelledby="usuarios-titulo" className={styles.pagina}>
      <h1 id="usuarios-titulo">Usuarios y roles</h1>
      <p aria-live="polite" className={styles.aviso}>
        {aviso}
      </p>
      {error ? <p role="alert">{error}</p> : null}
      {!usuarios && !error ? <p role="status">Cargando usuarios…</p> : null}
      {usuarios ? (
        <div className={styles.tablaContenedor}>
          <table className={styles.tabla}>
            <caption>{usuarios.length} cuentas registradas</caption>
            <thead>
              <tr>
                <th scope="col">Nombre</th>
                <th scope="col">Correo electrónico</th>
                <th scope="col">Rol</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id}>
                  <th scope="row">{u.nombre}</th>
                  <td>{u.email}</td>
                  <td>
                    <label className="visualmente-oculto" htmlFor={`rol-${u.id}`}>
                      Rol de {u.nombre}
                    </label>
                    <select
                      className={styles.selector}
                      disabled={u.id === yo?.id || guardando === u.id}
                      id={`rol-${u.id}`}
                      onChange={(e) => void actualizarRol(u, e.target.value as Rol)}
                      value={u.rol}
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {NOMBRE_ROL[r]}
                        </option>
                      ))}
                    </select>
                    {u.id === yo?.id ? <span className={styles.nota}> (tu cuenta)</span> : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
