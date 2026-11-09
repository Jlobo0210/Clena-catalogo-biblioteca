import { Link } from 'react-router-dom';
import { RUTAS } from '../../../config/rutas';
import styles from '../../../shared/components/PaginaPendiente.module.css';

export function AccesoDenegado() {
  return (
    <section aria-labelledby="acceso-denegado-titulo" className={styles.pagina}>
      <h1 id="acceso-denegado-titulo">No tienes acceso a esta sección</h1>
      <p>Esta sección es solo para el personal de la biblioteca. Si crees que es un error, pide ayuda en el mostrador.</p>
      <Link to={RUTAS.inicio}>Volver al inicio</Link>
    </section>
  );
}
