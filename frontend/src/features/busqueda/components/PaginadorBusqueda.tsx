import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './PaginadorBusqueda.module.css';

interface PaginadorBusquedaProps {
  paginaActual: number;
  totalPaginas: number;
  onCambiar: (pagina: number) => void;
}

export function PaginadorBusqueda({
  paginaActual,
  totalPaginas,
  onCambiar,
}: PaginadorBusquedaProps) {
  if (totalPaginas <= 1) return null;

  return (
    <nav aria-label="Paginación de resultados" className={styles.paginador}>
      <button
        aria-label="Página anterior"
        className={styles.boton}
        disabled={paginaActual <= 1}
        onClick={() => onCambiar(paginaActual - 1)}
        type="button"
      >
        <ChevronLeft aria-hidden="true" size={20} />
      </button>

      <span className={styles.info}>
        Página {paginaActual} de {totalPaginas}
      </span>

      <button
        aria-label="Página siguiente"
        className={styles.boton}
        disabled={paginaActual >= totalPaginas}
        onClick={() => onCambiar(paginaActual + 1)}
        type="button"
      >
        <ChevronRight aria-hidden="true" size={20} />
      </button>
    </nav>
  );
}
