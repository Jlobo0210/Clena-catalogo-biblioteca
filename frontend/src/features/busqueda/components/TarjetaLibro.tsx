import { BookOpen, Calendar, Globe, Tag } from 'lucide-react';
import type { LibroDto } from '../../catalogo/types';
import styles from './TarjetaLibro.module.css';

const ETIQUETAS_TIPO: Record<string, string> = {
  LIBRO: 'Libro',
  REVISTA: 'Revista',
  TESIS: 'Tesis',
  TRABAJO_DE_GRADO: 'Trabajo de grado',
  MATERIAL_AUDIOVISUAL: 'Audiovisual',
  OTRO: 'Otro',
};

interface TarjetaLibroProps {
  libro: LibroDto;
}

export function TarjetaLibro({ libro }: TarjetaLibroProps) {
  const autores = libro.autores.map((a) => a.nombre).join(', ');
  const temas = libro.temas.map((t) => t.nombre);

  return (
    <article aria-label={libro.titulo} className={styles.tarjeta}>
      <div className={styles.icono} aria-hidden="true">
        <BookOpen size={28} />
      </div>
      <div className={styles.contenido}>
        <h3 className={styles.titulo}>{libro.titulo}</h3>
        {autores ? <p className={styles.autores}>{autores}</p> : null}
        <div className={styles.meta}>
          {libro.anioPublicacion !== null ? (
            <span className={styles.chip}>
              <Calendar aria-hidden="true" size={14} />
              {libro.anioPublicacion}
            </span>
          ) : null}
          {libro.idioma ? (
            <span className={styles.chip}>
              <Globe aria-hidden="true" size={14} />
              {libro.idioma.toUpperCase()}
            </span>
          ) : null}
          <span className={styles.chip}>
            <Tag aria-hidden="true" size={14} />
            {ETIQUETAS_TIPO[libro.tipoMaterial] ?? libro.tipoMaterial}
          </span>
          {libro.formato === 'DIGITAL' || libro.formato === 'FISICO_Y_DIGITAL' ? (
            <span className={`${styles.chip} ${styles.digital}`}>Digital</span>
          ) : null}
        </div>
        {temas.length > 0 ? (
          <div className={styles.temas} aria-label="Temas">
            {temas.map((t) => (
              <span className={styles.tema} key={t}>
                {t}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}
