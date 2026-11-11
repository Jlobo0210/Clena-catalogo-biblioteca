import { BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { rutaLibro } from '../../../config/rutas';
import {
  NOMBRE_FORMATO,
  NOMBRE_TIPO_MATERIAL,
  listaNombres,
  nombreIdioma,
} from '../../catalogo/etiquetas';
import type { LibroDto } from '../../catalogo/types';
import styles from './ResultadoLibro.module.css';

interface ResultadoLibroProps {
  libro: LibroDto;
  /** URL de la búsqueda actual, para que el detalle ofrezca «Volver a los resultados». */
  desde: string;
}

export function ResultadoLibro({ desde, libro }: ResultadoLibroProps) {
  const datos = [
    NOMBRE_TIPO_MATERIAL[libro.tipoMaterial],
    NOMBRE_FORMATO[libro.formato],
    libro.anioPublicacion ? String(libro.anioPublicacion) : null,
    nombreIdioma(libro.idioma),
  ].filter((dato): dato is string => Boolean(dato));

  return (
    <li className={styles.resultado}>
      <article aria-labelledby={`libro-${libro.id}`}>
        <h3 className={styles.titulo} id={`libro-${libro.id}`}>
          <BookOpen aria-hidden="true" className={styles.icono} size={22} />
          <Link state={{ desde }} to={rutaLibro(libro.id)}>
            {libro.titulo}
          </Link>
        </h3>
        <p className={styles.autores}>{listaNombres(libro.autores)}</p>
        <ul aria-label="Datos del libro" className={styles.datos}>
          {datos.map((dato) => (
            <li key={dato}>{dato}</li>
          ))}
        </ul>
        {libro.temas.length > 0 ? (
          <p className={styles.temas}>
            <span>Temas:</span> {listaNombres(libro.temas)}
          </p>
        ) : null}
      </article>
    </li>
  );
}
