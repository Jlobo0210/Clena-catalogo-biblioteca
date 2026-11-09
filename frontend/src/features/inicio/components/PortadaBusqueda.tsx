import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { RUTAS } from '../../../config/rutas';
import { FormularioBusqueda } from '../../busqueda/components/FormularioBusqueda';
import styles from './PortadaBusqueda.module.css';

interface PortadaBusquedaProps {
  totalLibros: number | null;
}

export function PortadaBusqueda({ totalLibros }: PortadaBusquedaProps) {
  const cantidad =
    totalLibros === null
      ? 'libros'
      : `${new Intl.NumberFormat('es-CO').format(totalLibros)} ${
          totalLibros === 1 ? 'libro' : 'libros'
        }`;

  return (
    <section className={styles.portada} aria-labelledby="inicio-titulo">
      <div aria-hidden="true" className={styles.decoracion}>
        <span className={styles.circulo} />
        <svg className={styles.estrella} viewBox="0 0 180 180">
          <polygon
            fill="currentColor"
            points="90,0 108,62 180,45 118,72 180,90 118,108 180,135 108,118 90,180 72,118 0,135 62,108 0,90 62,72 0,45 72,62"
          />
        </svg>
      </div>
      <div className={styles.contenido}>
        <p className={styles.insignia}>
          <span aria-hidden="true" />
          Complejo Cultural de La Aduana
        </p>
        <h1 id="inicio-titulo">Explore el patrimonio bibliográfico y cultural del Gran Caribe</h1>
        <p className={styles.descripcion}>
          Encuentre {cantidad}, actas del Archivo Histórico, prensa de época y colecciones
          patrimoniales disponibles para consulta en sala y préstamos guiados.
        </p>
        <FormularioBusqueda />
        <p className={styles.avanzada}>
          ¿Busca una cota o código específico?{' '}
          <Link to={RUTAS.busquedaAvanzada}>
            Ir a búsqueda avanzada y filtros detallados
            <ArrowRight aria-hidden="true" size={18} />
          </Link>
        </p>
      </div>
    </section>
  );
}
