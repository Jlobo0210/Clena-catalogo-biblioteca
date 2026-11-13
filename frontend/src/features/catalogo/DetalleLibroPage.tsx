import { useState } from 'react';
import {
  ArrowLeft,
  CalendarDays,
  Clipboard,
  ExternalLink,
  MapPin,
  Printer,
  RotateCw,
  Tag,
} from 'lucide-react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { RUTAS } from '../../config/rutas';
import { useConsulta } from '../../shared/hooks/useConsulta';
import { listarEjemplares, obtenerLibro } from './api/libros.api';
import {
  NOMBRE_ESTADO_EJEMPLAR,
  NOMBRE_FORMATO,
  NOMBRE_TIPO_MATERIAL,
  listaNombres,
  nombreIdioma,
} from './etiquetas';
import type { EjemplarDto, LibroDto, ListaEjemplaresDto } from './types';
import styles from './DetalleLibroPage.module.css';

interface Detalle {
  libro: LibroDto;
  ejemplares: ListaEjemplaresDto;
}

/** «Sala 1 · Sección Humanidades · Estante E-01». */
function textoUbicacion({ ubicacion }: EjemplarDto): string {
  return `${ubicacion.sala} · Sección ${ubicacion.seccion} · Estante ${ubicacion.estante}`;
}

/** HU-24: detalle del libro con su ubicación física y disponibilidad (diseño de Luis, datos de HU-17). */
export function DetalleLibroPage() {
  const { id = '' } = useParams<{ id: string }>();
  const location = useLocation();
  const desde = (location.state as { desde?: string } | null)?.desde;

  const consulta = useConsulta<Detalle>(id, async (signal) => {
    const [libro, ejemplares] = await Promise.all([
      obtenerLibro(id, signal),
      listarEjemplares(id, signal),
    ]);
    return { libro, ejemplares };
  });

  if (consulta.estado === 'cargando') {
    return (
      <p aria-busy="true" className={styles.feedback} role="status">
        Cargando la ficha de la obra…
      </p>
    );
  }

  if (consulta.estado === 'error') {
    const noExiste =
      consulta.error.tipo === 'no-encontrado' || consulta.error.tipo === 'validacion';
    return (
      <section aria-labelledby="detalle-error" className={styles.feedback} role="alert">
        <title>Obra no disponible · Consulta Fácil</title>
        <h1 id="detalle-error">
          {noExiste ? 'No encontramos esta obra' : 'No pudimos cargar esta obra'}
        </h1>
        <p>
          {noExiste
            ? 'Puede que el enlace esté mal escrito o que la obra ya no esté en el catálogo.'
            : consulta.error.mensaje}
        </p>
        {noExiste ? (
          <Link to={desde ?? RUTAS.buscar}>{desde ? 'Volver a los resultados' : 'Ir a la búsqueda'}</Link>
        ) : (
          <button onClick={consulta.reintentar} type="button">
            <RotateCw aria-hidden="true" size={18} /> Intentar de nuevo
          </button>
        )}
      </section>
    );
  }

  const { ejemplares, libro } = consulta.datos;
  const autores = listaNombres(libro.autores) || 'Autor no registrado';
  const temas = libro.temas.map((tema) => tema.nombre);
  const soloDigital = libro.formato === 'DIGITAL';
  const { disponibles, totalEjemplares } = ejemplares.disponibilidad;

  const disponibilidad = soloDigital
    ? { texto: 'Disponible en versión digital', clase: styles.availability }
    : disponibles > 0
      ? {
          texto: `${disponibles} de ${totalEjemplares} ${totalEjemplares === 1 ? 'ejemplar disponible' : 'ejemplares disponibles'}`,
          clase: styles.availability,
        }
      : {
          texto: totalEjemplares > 0 ? 'Sin ejemplares disponibles ahora' : 'Sin ejemplares registrados',
          clase: `${styles.availability} ${styles.noDisponible}`,
        };

  return (
    <div className={styles.page}>
      <title>{`${libro.titulo} · Consulta Fácil`}</title>
      <nav aria-label="Migas de pan" className={styles.breadcrumbs}>
        <Link to={desde ?? RUTAS.buscar}>
          <ArrowLeft aria-hidden="true" size={18} /> {desde ? 'Volver a los resultados' : 'Ir a la búsqueda'}
        </Link>
        <span aria-hidden="true">Catálogo</span>
        <span aria-hidden="true">›</span>
        <strong>Detalle de la obra</strong>
        <button onClick={() => window.print()} type="button">
          <Printer aria-hidden="true" size={17} /> Imprimir ficha
        </button>
      </nav>

      <div className={styles.card}>
        <aside className={styles.coverColumn}>
          <div aria-hidden="true" className={styles.cover}>
            <span>BIBLIOTECA PILOTO DEL CARIBE</span>
            <strong>{libro.titulo}</strong>
            <i>{autores}</i>
            <small>{NOMBRE_TIPO_MATERIAL[libro.tipoMaterial]}</small>
          </div>
          {soloDigital ? null : (
            <a className={styles.primaryAction} href="#ubicacion-titulo">
              <MapPin aria-hidden="true" size={19} /> Ver ubicación en estantería
            </a>
          )}
          {libro.enlaceDigital ? (
            <a
              className={styles.secondaryAction}
              href={libro.enlaceDigital}
              rel="noopener noreferrer"
              target="_blank"
            >
              <ExternalLink aria-hidden="true" size={19} /> Leer la versión digital
              <span className="visualmente-oculto"> (se abre en otra pestaña)</span>
            </a>
          ) : null}
        </aside>

        <article aria-labelledby="detalle-titulo" className={styles.content}>
          <p className={styles.collection}>
            <Tag aria-hidden="true" size={16} /> {temas[0] ?? 'Catálogo general'}
          </p>
          <p className={disponibilidad.clase}>
            <span aria-hidden="true" /> {disponibilidad.texto}
          </p>
          <h1 id="detalle-titulo">{libro.titulo}</h1>
          <p className={styles.authors}>
            Autoría: <strong>{autores}</strong>
          </p>

          <Ubicacion ejemplares={ejemplares} libro={libro} />

          <section aria-labelledby="ficha-titulo" className={styles.technical}>
            <h2 id="ficha-titulo">
              <CalendarDays aria-hidden="true" size={18} /> Ficha técnica esencial
            </h2>
            <dl>
              <div>
                <dt>Año de publicación</dt>
                <dd>{libro.anioPublicacion ?? 'No registrado'}</dd>
              </div>
              <div>
                <dt>Idioma</dt>
                <dd>{nombreIdioma(libro.idioma)}</dd>
              </div>
              <div>
                <dt>ISBN</dt>
                <dd>{libro.isbn ?? 'No registrado'}</dd>
              </div>
              <div>
                <dt>Tipo de material</dt>
                <dd>{NOMBRE_TIPO_MATERIAL[libro.tipoMaterial]}</dd>
              </div>
              <div>
                <dt>Formato</dt>
                <dd>{NOMBRE_FORMATO[libro.formato]}</dd>
              </div>
            </dl>
          </section>

          <section aria-labelledby="temas-titulo" className={styles.tags}>
            <h2 id="temas-titulo">
              <Tag aria-hidden="true" size={18} /> Materias y descriptores temáticos
            </h2>
            <div>
              {temas.length ? (
                temas.map((tema) => <span key={tema}>{tema}</span>)
              ) : (
                <p>No hay temas asociados.</p>
              )}
            </div>
          </section>
        </article>
      </div>
    </div>
  );
}

/** «Dónde encontrarlo»: cada ejemplar con su sala, sección, estante y estado. */
function Ubicacion({ ejemplares, libro }: Detalle) {
  const [copiado, setCopiado] = useState<'si' | 'error' | null>(null);
  const soloDigital = libro.formato === 'DIGITAL';
  const disponibles = ejemplares.items.filter((e) => e.estado === 'DISPONIBLE');

  const copiar = async () => {
    const lugares = [...new Set((disponibles.length ? disponibles : ejemplares.items).map(textoUbicacion))];
    try {
      await navigator.clipboard.writeText(`${libro.titulo}: ${lugares.join('; ')}`);
      setCopiado('si');
    } catch {
      setCopiado('error');
    }
  };

  return (
    <section aria-labelledby="ubicacion-titulo" className={styles.location}>
      <h2 id="ubicacion-titulo" tabIndex={-1}>
        <MapPin aria-hidden="true" size={18} /> Ubicación y disponibilidad
      </h2>
      {soloDigital ? (
        <p>Esta obra solo está disponible en versión digital.</p>
      ) : ejemplares.items.length === 0 ? (
        <p>Esta obra todavía no tiene ejemplares registrados en la biblioteca.</p>
      ) : (
        <>
          {disponibles.length === 0 ? (
            <p>
              Ningún ejemplar está disponible en este momento.
              {ejemplares.disponibilidad.proximaDevolucion ? (
                <>
                  {' '}Fecha estimada de devolución más próxima:{' '}
                  <strong>
                    {new Date(ejemplares.disponibilidad.proximaDevolucion).toLocaleDateString('es-CO', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </strong>
                  .
                </>
              ) : (
                ' Pregunte al personal cuándo vuelve a estar en sala.'
              )}
            </p>
          ) : null}
          <ul className={styles.ejemplares}>
            {ejemplares.items.map((ejemplar) => (
              <li key={ejemplar.id}>
                <strong>{textoUbicacion(ejemplar)}</strong>
                <span className={styles.meta}>
                  <span className={ejemplar.estado === 'DISPONIBLE' ? styles.estadoDisponible : styles.estadoOcupado}>
                    {NOMBRE_ESTADO_EJEMPLAR[ejemplar.estado]}
                  </span>
                  <span>Código {ejemplar.codigoInventario}</span>
                </span>
              </li>
            ))}
          </ul>
          <button onClick={() => void copiar()} type="button">
            <Clipboard aria-hidden="true" size={16} /> Copiar ubicación
          </button>
          <p aria-live="polite" className={styles.copiado}>
            {copiado === 'si'
              ? 'Ubicación copiada.'
              : copiado === 'error'
                ? 'No se pudo copiar. Anote la sala, la sección y el estante.'
                : ''}
          </p>
        </>
      )}
    </section>
  );
}
