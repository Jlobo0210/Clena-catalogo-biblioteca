import {
  CircleHelp,
  CircleUserRound,
  Home,
  LayoutDashboard,
  LibraryBig,
  LogIn,
  LogOut,
  Monitor,
  RotateCcw,
  Shapes,
} from 'lucide-react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { RUTAS } from '../../config/rutas';
import { terminal } from '../../config/terminal';
import { useSesion } from '../../features/auth/sesion/contextoSesion';
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

        <div className={styles.terminal}>
          <div className={styles.terminalTexto}>
            <Monitor aria-hidden="true" className={styles.terminalIcono} size={18} />
            <span>Terminal:</span>
            <strong>{terminal.codigo.replace('T-04', 'T-04')}</strong>
          </div>
          {usuario ? (
            <>
              <Link className={styles.usuarioEnlace} to={RUTAS.miCuenta}>
                <CircleUserRound aria-hidden="true" size={20} />
                <span>{usuario.nombre}</span>
              </Link>
              <button
                aria-label="Cerrar sesión"
                className={styles.ingresar}
                onClick={() => void cerrarSesion()}
                type="button"
              >
                <LogOut aria-hidden="true" size={18} />
                Cerrar sesión
              </button>
            </>
          ) : (
            <Link className={styles.ingresar} to={RUTAS.ingresar}>
              <LogIn aria-hidden="true" size={18} />
              Inicio de sesión
            </Link>
          )}
          <button
            aria-label="Reiniciar la terminal"
            className={styles.reiniciar}
            onClick={onReiniciar}
            title="Reiniciar la terminal"
            type="button"
          >
            <RotateCcw aria-hidden="true" size={18} />
          </button>
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
            <Home aria-hidden="true" size={24} />
            <span>
              <strong>Inicio</strong>
              <small>Búsqueda general</small>
            </span>
          </NavLink>
          <NavLink
            className={({ isActive }) =>
              `${styles.enlaceNav} ${isActive ? styles.activo : ''}`
            }
            to={RUTAS.temas}
          >
            <Shapes aria-hidden="true" size={20} />
            <span>
              <strong>Explorar</strong>
              <small>Búsqueda por tema</small>
            </span>
          </NavLink>
          <Link
            className={styles.enlaceNav}
            to={{ pathname: RUTAS.inicio, hash: '#contacto' }}
          >
            <LibraryBig aria-hidden="true" size={24} />
            <span>
              <strong>La Biblioteca</strong>
              <small>Servicios y horarios</small>
            </span>
          </Link>
          <Link
            className={styles.enlaceNav}
            to={{ pathname: RUTAS.inicio, hash: '#ayuda-titulo' }}
          >
            <CircleHelp aria-hidden="true" size={24} />
            <span>
              <strong>Ayuda</strong>
              <small>Contacto y asistencia</small>
            </span>
          </Link>
          {tieneRol('PERSONAL', 'ADMINISTRADOR') ? (
            <NavLink
              className={({ isActive }) =>
                `${styles.enlaceNav} ${isActive ? styles.activo : ''}`
              }
              to={RUTAS.panel}
            >
              <LayoutDashboard aria-hidden="true" size={20} />
              <span>
                <strong>Panel</strong>
                <small>Administración</small>
              </span>
            </NavLink>
          ) : null}
        </nav>
    </header>
  );
}
