import { BookCopy, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { RUTAS } from '../../config/rutas';
import { useSesion } from '../auth/sesion/contextoSesion';
import { NOMBRE_ROL } from '../auth/types';
import styles from './PanelPage.module.css';

/** Punto de entrada del personal y la administración. Las secciones se completan en HU-25. */
export function PanelPage() {
  const { tieneRol, usuario } = useSesion();

  return (
    <section aria-labelledby="panel-titulo" className={styles.pagina}>
      <h1 id="panel-titulo">Panel de la biblioteca</h1>
      <p>
        Hola, {usuario?.nombre}. Entraste como <strong>{usuario ? NOMBRE_ROL[usuario.rol] : ''}</strong>.
      </p>
      <ul className={styles.opciones}>
        <li className={styles.opcion}>
          <BookCopy aria-hidden="true" size={28} />
          <div>
            <h2>Gestionar el catálogo</h2>
            <p>Libros, autores, temas y ejemplares. Disponible pronto.</p>
          </div>
        </li>
        {tieneRol('ADMINISTRADOR') ? (
          <li className={styles.opcion}>
            <Users aria-hidden="true" size={28} />
            <div>
              <h2>
                <Link to={RUTAS.usuarios}>Usuarios y roles</Link>
              </h2>
              <p>Consulta las cuentas y asigna el rol de personal o administración.</p>
            </div>
          </li>
        ) : null}
      </ul>
    </section>
  );
}
