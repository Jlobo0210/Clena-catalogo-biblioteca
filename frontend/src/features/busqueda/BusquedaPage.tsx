import { Link, useSearchParams } from 'react-router-dom';
import { RUTAS } from '../../config/rutas';
import { etiquetaAmbito } from './ambitos';
import { leerParametrosBusqueda } from './parametrosBusqueda';
import styles from './BusquedaPage.module.css';

export function BusquedaPage() {
  const [params] = useSearchParams();
  const { ambito, q } = leerParametrosBusqueda(params);

  return (
    <section className={styles.pagina} aria-labelledby="resultados-titulo">
      <title>Resultados de búsqueda · Consulta Fácil</title>
      {/* TODO(HU-24): reemplazar por la pantalla de resultados. */}
      <h1 id="resultados-titulo">Resultados de búsqueda</h1>
      <p>
        {q ? `Buscó «${q}» en ${etiquetaAmbito(ambito)}.` : `Ámbito: ${etiquetaAmbito(ambito)}.`}
      </p>
      <p>Pronto verá aquí los libros encontrados.</p>
      <Link to={RUTAS.inicio}>Volver al inicio</Link>
    </section>
  );
}
