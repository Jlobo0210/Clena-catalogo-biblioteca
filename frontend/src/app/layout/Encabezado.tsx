import { BookOpen, CircleUserRound, Headset, LogOut, Shapes } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import { RUTAS } from '../../config/rutas';
import { terminal } from '../../config/terminal';
import { MarcaBiblioteca } from '../../shared/ui/MarcaBiblioteca';
import styles from './Encabezado.module.css';

interface EncabezadoProps {
  onReiniciar: () => void;
}

export function Encabezado({ onReiniciar }: EncabezadoProps) {
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
        </nav>

        <div className={styles.terminal}>
          <div className={styles.terminalTexto}>
            <span>Usuario en terminal</span>
            <strong>{terminal.nombre}</strong>
          </div>
          <CircleUserRound aria-hidden="true" className={styles.usuario} size={40} />
          <button
            aria-label="Reiniciar la terminal"
            className={styles.reiniciar}
            onClick={onReiniciar}
            title="Reiniciar la terminal"
            type="button"
          >
            <LogOut aria-hidden="true" size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}
