import { Link } from 'react-router-dom';
import { RUTAS } from '../../config/rutas';
import styles from './PaginaPendiente.module.css';

interface PaginaPendienteProps {
  titulo: string;
  descripcion?: string;
}

export function PaginaPendiente({
  descripcion = 'Esta sección estará disponible pronto.',
  titulo,
}: PaginaPendienteProps) {
  return (
    <section className={styles.pagina} aria-labelledby="pendiente-titulo">
      <h1 id="pendiente-titulo">{titulo}</h1>
      <p>{descripcion}</p>
      <Link to={RUTAS.inicio}>Volver al inicio</Link>
    </section>
  );
}
