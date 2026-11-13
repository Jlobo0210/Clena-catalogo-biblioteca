import { BookCopy, BookUp, CalendarClock, FileUp, QrCode, Tags, UserPen, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { RUTAS } from '../../config/rutas';
import { useSesion } from '../auth/sesion/contextoSesion';
import { NOMBRE_ROL } from '../auth/types';
import styles from './PanelPage.module.css';

/** Punto de entrada del personal y la administración (HU-25). */
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
          <BookUp aria-hidden="true" size={28} />
          <div>
            <h2>
              <Link to={RUTAS.prestamosPersonal}>Préstamos y devoluciones</Link>
            </h2>
            <p>Presta un ejemplar con su código y registra las devoluciones.</p>
          </div>
        </li>
        <li className={styles.opcion}>
          <CalendarClock aria-hidden="true" size={28} />
          <div>
            <h2>
              <Link to={RUTAS.prestamosSeguimiento}>Seguimiento de préstamos</Link>
            </h2>
            <p>Revisa los préstamos vencidos y los que están por vencer, con los días de retraso.</p>
          </div>
        </li>
        <li className={styles.opcion}>
          <UserPen aria-hidden="true" size={28} />
          <div>
            <h2>
              <Link to={RUTAS.panelAutores}>Autores</Link>
            </h2>
            <p>Agrega, corrige o elimina los autores del catálogo.</p>
          </div>
        </li>
        <li className={styles.opcion}>
          <Tags aria-hidden="true" size={28} />
          <div>
            <h2>
              <Link to={RUTAS.panelTemas}>Temas</Link>
            </h2>
            <p>Organiza los temas con los que se clasifican y exploran los libros.</p>
          </div>
        </li>
        <li className={styles.opcion}>
          <FileUp aria-hidden="true" size={28} />
          <div>
            <h2>
              <Link to={RUTAS.panelImportar}>Importar desde CSV</Link>
            </h2>
            <p>Carga muchos libros y ejemplares a la vez con la plantilla.</p>
          </div>
        </li>
        <li className={styles.opcion}>
          <BookCopy aria-hidden="true" size={28} />
          <div>
            <h2>
              <Link to={RUTAS.panelLibros}>Libros y ejemplares</Link>
            </h2>
            <p>Registra libros con sus autores y temas, y dónde está cada ejemplar.</p>
          </div>
        </li>
        <li className={styles.opcion}>
          <QrCode aria-hidden="true" size={28} />
          <div>
            <h2>
              <Link to={RUTAS.panelQr}>Código QR de acceso</Link>
            </h2>
            <p>Descarga o imprime el QR que abre la búsqueda en el celular.</p>
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
