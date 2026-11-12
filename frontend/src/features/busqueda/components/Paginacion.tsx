import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import styles from './Paginacion.module.css';

interface PaginacionProps {
  pagina: number;
  totalPaginas: number;
  /** URL de una página dada (mantiene el resto de la búsqueda). */
  urlDePagina: (pagina: number) => string;
}

/** «Anterior · Página 2 de 5 · Siguiente», con enlaces para poder abrirlos o compartirlos. */
export function Paginacion({ pagina, totalPaginas, urlDePagina }: PaginacionProps) {
  if (totalPaginas <= 1) return null;

  return (
    <nav aria-label="Páginas de resultados" className={styles.paginacion}>
      {pagina > 1 ? (
        <Link className={styles.enlace} rel="prev" to={urlDePagina(pagina - 1)}>
          <ChevronLeft aria-hidden="true" size={20} />
          Anterior
        </Link>
      ) : (
        <span aria-hidden="true" className={styles.vacio} />
      )}
      <p aria-current="page" className={styles.actual}>
        Página {pagina} de {totalPaginas}
      </p>
      {pagina < totalPaginas ? (
        <Link className={styles.enlace} rel="next" to={urlDePagina(pagina + 1)}>
          Siguiente
          <ChevronRight aria-hidden="true" size={20} />
        </Link>
      ) : (
        <span aria-hidden="true" className={styles.vacio} />
      )}
    </nav>
  );
}
