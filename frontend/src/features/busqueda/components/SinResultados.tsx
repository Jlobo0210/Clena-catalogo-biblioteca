import { SearchX } from 'lucide-react';
import { Link } from 'react-router-dom';
import { RUTAS } from '../../../config/rutas';
import styles from './SinResultados.module.css';

interface SinResultadosProps {
  q: string;
}

/** Mensaje claro cuando la búsqueda no encuentra nada, con sugerencias para seguir (HU-24). */
export function SinResultados({ q }: SinResultadosProps) {
  return (
    <div className={styles.caja}>
      <SearchX aria-hidden="true" className={styles.icono} size={40} />
      <h2 className={styles.titulo}>No encontramos libros para «{q}»</h2>
      <p>Algunas ideas para seguir buscando:</p>
      <ul className={styles.sugerencias}>
        <li>Revise la ortografía. La búsqueda tolera algunos errores, pero no todos.</li>
        <li>Use menos palabras: por ejemplo, solo el apellido del autor o una palabra del título.</li>
        <li>Pruebe con un tema más general.</li>
      </ul>
      <p className={styles.acciones}>
        <Link to={RUTAS.temas}>Explorar el catálogo por tema</Link>
        <span aria-hidden="true">·</span>
        <span>Si no lo encuentra, pregunte al personal de la biblioteca.</span>
      </p>
    </div>
  );
}
