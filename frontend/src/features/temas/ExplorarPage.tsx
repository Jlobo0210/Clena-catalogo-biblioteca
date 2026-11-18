import { useMemo, useRef, useState } from 'react';
import {
  ArrowDownAZ,
  ArrowRight,
  BookOpen,
  Eraser,
  Library,
  RotateCw,
  Search,
  Shapes,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { listarTemas } from '../catalogo/api/temas.api';
import type { TemaDto } from '../catalogo/types';
import { RUTAS, rutaTema } from '../../config/rutas';
import { useConsulta } from '../../shared/hooks/useConsulta';
import { Boton } from '../../shared/ui/Boton';
import styles from './ExplorarPage.module.css';

type Orden = 'alfabetico' | 'masLibros';

/** Sin tildes ni mayúsculas, para que «poesia» encuentre «Poesía». */
function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('es');
}

function titulos(n: number): string {
  return `${n} ${n === 1 ? 'título' : 'títulos'}`;
}

/**
 * HU-35: sección para explorar el catálogo por categorías (temas), separada de la búsqueda
 * general. Lista las categorías reales con su cantidad de libros; cada una abre su página
 * con los libros y los mismos filtros de la búsqueda.
 */
export function ExplorarPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [filtro, setFiltro] = useState('');
  const [orden, setOrden] = useState<Orden>('alfabetico');
  const consulta = useConsulta('temas', (signal) => listarTemas(signal));

  const temas: TemaDto[] = useMemo(
    () => (consulta.estado === 'listo' ? consulta.datos.items : []),
    [consulta],
  );

  const visibles = useMemo(() => {
    const buscado = normalizar(filtro.trim());
    const filtrados = buscado
      ? temas.filter(
          (t) =>
            normalizar(t.nombre).includes(buscado) ||
            normalizar(t.descripcion ?? '').includes(buscado),
        )
      : temas;
    return [...filtrados].sort((a, b) =>
      orden === 'masLibros'
        ? b.totalLibros - a.totalLibros || a.nombre.localeCompare(b.nombre, 'es')
        : a.nombre.localeCompare(b.nombre, 'es'),
    );
  }, [filtro, orden, temas]);

  const limpiar = () => {
    setFiltro('');
    inputRef.current?.focus();
  };

  return (
    <div className={styles.page}>
      <title>Explorar por categorías · Consulta Fácil</title>
      <section className={styles.panel} aria-labelledby="explorar-titulo">
        <p className={styles.eyebrow}>
          <Shapes aria-hidden="true" size={16} /> Categorías temáticas
        </p>
        <div className={styles.summary}>
          <h1 id="explorar-titulo">Explorar por categorías</h1>
          <p>
            ¿No sabe el título ni el autor? Elija un tema y vea los libros que la biblioteca
            tiene sobre él.
          </p>
        </div>

        {consulta.estado === 'listo' && temas.length > 0 ? (
          <>
            <form
              aria-label="Buscar una categoría"
              className={styles.searchForm}
              onSubmit={(e) => e.preventDefault()}
              role="search"
            >
              <label className="visualmente-oculto" htmlFor="explorar-filtro">
                Buscar una categoría por su nombre
              </label>
              <div className={styles.inputWrapper}>
                <Search aria-hidden="true" size={20} />
                <input
                  ref={inputRef}
                  autoComplete="off"
                  id="explorar-filtro"
                  onChange={(e) => setFiltro(e.target.value)}
                  placeholder="Buscar una categoría, por ejemplo «historia»"
                  type="search"
                  value={filtro}
                />
              </div>
              {filtro ? (
                <Boton icono={Eraser} onClick={limpiar} variante="oscuro">
                  Limpiar
                </Boton>
              ) : null}
            </form>

            <div className={styles.panelFooter}>
              <p className={styles.sectionDescription}>
                {visibles.length === temas.length
                  ? `${temas.length} ${temas.length === 1 ? 'categoría' : 'categorías'}`
                  : `${visibles.length} de ${temas.length} categorías`}
              </p>
              <div aria-label="Ordenar categorías" className={styles.sortControl} role="group">
                <span>Ordenar:</span>
                <button
                  aria-pressed={orden === 'alfabetico'}
                  className={orden === 'alfabetico' ? styles.controlActive : ''}
                  onClick={() => setOrden('alfabetico')}
                  type="button"
                >
                  <ArrowDownAZ aria-hidden="true" size={15} /> A-Z
                </button>
                <button
                  aria-pressed={orden === 'masLibros'}
                  className={orden === 'masLibros' ? styles.controlActive : ''}
                  onClick={() => setOrden('masLibros')}
                  type="button"
                >
                  <Library aria-hidden="true" size={15} /> Más títulos
                </button>
              </div>
            </div>
          </>
        ) : null}

        {consulta.estado === 'cargando' ? <p role="status">Cargando categorías…</p> : null}

        {consulta.estado === 'error' ? (
          <div className={styles.connectionNotice} role="alert">
            <p>No pudimos cargar las categorías. {consulta.error.mensaje}</p>
            <button onClick={consulta.reintentar} type="button">
              <RotateCw aria-hidden="true" size={15} /> Intentar de nuevo
            </button>
          </div>
        ) : null}

        {consulta.estado === 'listo' && temas.length === 0 ? (
          <div className={styles.emptyState}>
            <h2>Todavía no hay categorías en el catálogo</h2>
            <p>
              Mientras tanto, puede usar la <Link to={RUTAS.buscar}>búsqueda general</Link>.
            </p>
          </div>
        ) : null}

        {consulta.estado === 'listo' && temas.length > 0 && visibles.length === 0 ? (
          <div className={styles.emptyState}>
            <h2>Ninguna categoría coincide con «{filtro.trim()}»</h2>
            <ul>
              <li>Revise la ortografía o pruebe con una palabra más general.</li>
              <li>
                Si busca un libro o un autor, use la{' '}
                <Link to={RUTAS.buscar}>búsqueda general</Link>.
              </li>
            </ul>
          </div>
        ) : null}

        {/* Anuncia cuántas categorías quedan al escribir en el filtro. */}
        <p className="visualmente-oculto" role="status">
          {consulta.estado === 'listo' && filtro.trim()
            ? `${visibles.length} ${visibles.length === 1 ? 'categoría encontrada' : 'categorías encontradas'}`
            : ''}
        </p>
      </section>

      {visibles.length > 0 ? (
        <section aria-labelledby="categorias-titulo">
          <h2 className="visualmente-oculto" id="categorias-titulo">
            Categorías
          </h2>
          <ul className={styles.topicList}>
            {visibles.map((tema) => (
              <li key={tema.id}>
                <article aria-labelledby={`tema-${tema.id}`} className={styles.topicCard}>
                  <span aria-hidden="true" className={styles.topicIcon}>
                    <BookOpen size={22} />
                  </span>
                  <div className={styles.topicContent}>
                    <p className={styles.topicMeta}>{titulos(tema.totalLibros)}</p>
                    <h3 id={`tema-${tema.id}`}>{tema.nombre}</h3>
                    <p>{tema.descripcion ?? 'Obras del catálogo clasificadas en este tema.'}</p>
                  </div>
                  <Link
                    aria-label={`Ver libros de ${tema.nombre}`}
                    className={styles.topicAction}
                    to={rutaTema(tema.id)}
                  >
                    Ver libros <ArrowRight aria-hidden="true" size={18} />
                  </Link>
                </article>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className={styles.help}>
        <Link to={RUTAS.buscar}>
          <Search aria-hidden="true" size={18} /> Ir a la búsqueda general
        </Link>
        <span>¿Necesita orientación?</span>
        <Link to={{ pathname: RUTAS.inicio, hash: '#ayuda-titulo' }}>
          Pedir ayuda <ArrowRight aria-hidden="true" size={18} />
        </Link>
      </div>
    </div>
  );
}
