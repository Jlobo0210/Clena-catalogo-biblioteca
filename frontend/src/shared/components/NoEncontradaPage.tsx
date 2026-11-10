import { Link } from 'react-router-dom';
import { RUTAS } from '../../config/rutas';
import styles from './PaginaPendiente.module.css';

export function NoEncontradaPage() {
  return (
    <section className={styles.pagina} aria-labelledby="no-encontrada-titulo">
      <h1 id="no-encontrada-titulo">No encontramos esta página</h1>
      <Link to={RUTAS.inicio}>Volver al inicio</Link>
    </section>
  );
}
