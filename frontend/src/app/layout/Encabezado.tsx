import { BookOpen, CircleUserRound, Headset, LayoutDashboard, LogIn, LogOut, Shapes } from 'lucide-react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { RUTAS } from '../../config/rutas';
import { terminal } from '../../config/terminal';
import { useSesion } from '../../features/auth/sesion/contextoSesion';
import { NOMBRE_ROL } from '../../features/auth/types';
import { MarcaBiblioteca } from '../../shared/ui/MarcaBiblioteca';
import styles from './Encabezado.module.css';

interface EncabezadoProps {
  onReiniciar: () => void;
}

export function Encabezado({ onReiniciar }: EncabezadoProps) {
  const { salir, tieneRol, usuario } = useSesion();
  const navigate = useNavigate();

  const cerrarSesion = async () => {
    await salir();
    navigate(RUTAS.inicio, { replace: true });
    document.getElementById('contenido')?.focus();
  };

  return (
    <header className={styles.encabezado}>
      <div className={styles.interno}>
        <div className={styles.marcaBloque}>
          <MarcaBiblioteca />
          <div className={styles.marcaTexto}>
            <p className={styles.meta}>
              <span>Barranquilla cultural</span>
              <span aria-hidden="true" className={styles.punto} />
              <span>Terminal de sala activo</span>
            </p>
            <Link className={styles.nombreBiblioteca} to={RUTAS.inicio}>
              Biblioteca Piloto del Caribe <span aria-hidden="true">|</span>{' '}
              <strong>Consulta Fácil</strong>
            </Link>
          </div>
        </div>

        <nav aria-label="Principal" className={styles.navegacion}>
          <NavLink
            className={({ isActive }) =>
              `${styles.enlaceNav} ${isActive ? styles.activo : ''}`
            }
            end
            to={RUTAS.inicio}
          >
            <BookOpen aria-hidden="true" size={20} />
            Catálogo
          </NavLink>
          <NavLink
            className={({ isActive }) =>
              `${styles.enlaceNav} ${isActive ? styles.activo : ''}`
            }
            to={RUTAS.temas}
          >
            <Shapes aria-hidden="true" size={20} />
            Explorar por tema
          </NavLink>
          <Link
            className={styles.enlaceNav}
            to={{ pathname: RUTAS.inicio, hash: '#contacto' }}
          >
            <Headset aria-hidden="true" size={20} />
            Contacto
          </Link>
          {tieneRol('PERSONAL', 'ADMINISTRADOR') ? (
            <NavLink
              className={({ isActive }) =>
                `${styles.enlaceNav} ${isActive ? styles.activo : ''}`
              }
              to={RUTAS.panel}
            >
              <LayoutDashboard aria-hidden="true" size={20} />
              Panel
            </NavLink>
          ) : null}
        </nav>

        <div className={styles.terminal}>
          {usuario ? (
            <>
              <Link className={styles.terminalTexto} to={RUTAS.miCuenta}>
                <span>{NOMBRE_ROL[usuario.rol]}</span>
                <strong>{usuario.nombre}</strong>
              </Link>
              <CircleUserRound aria-hidden="true" className={styles.usuario} size={40} />
              <button
                aria-label="Cerrar sesión"
                className={styles.reiniciar}
                onClick={() => void cerrarSesion()}
                title="Cerrar sesión"
                type="button"
              >
                <LogOut aria-hidden="true" size={20} />
              </button>
            </>
          ) : (
            <>
              <div className={styles.terminalTexto}>
                <span>Usuario en terminal</span>
                <strong>{terminal.nombre}</strong>
              </div>
              <Link className={styles.ingresar} to={RUTAS.ingresar}>
                <LogIn aria-hidden="true" size={20} />
                Iniciar sesión
              </Link>
              <button
                aria-label="Reiniciar la terminal"
                className={styles.reiniciar}
                onClick={onReiniciar}
                title="Reiniciar la terminal"
                type="button"
              >
                <LogOut aria-hidden="true" size={20} />
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
