import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import {
  ArrowDownAZ,
  ArrowRight,
  BookOpen,
  Clock3,
  Eraser,
  Search,
  Shapes,
  SlidersHorizontal,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { listarTemas } from '../catalogo/api/temas.api';
import type { TemaDto } from '../catalogo/types';
import { construirUrlBusqueda } from '../busqueda/parametrosBusqueda';
import { RUTAS } from '../../config/rutas';
import { Boton } from '../../shared/ui/Boton';
import styles from './ExplorarPage.module.css';

const COLECCIONES_REFERENCIA: TemaDto[] = [
  {
    id: 'referencia-literatura',
    nombre: 'Literatura caribeña',
    descripcion: 'Obras cumbres, autores costeños, novelas históricas y poesía regional.',
    totalLibros: 38,
    creadoEn: '2025-01-06',
    actualizadoEn: '2025-01-06',
  },
  {
    id: 'referencia-historia',
    nombre: 'Historia de Barranquilla',
    descripcion: 'Cronologías, arquitectura republicana, desarrollo portuario e hitos urbanos.',
    totalLibros: 29,
    creadoEn: '2025-01-05',
    actualizadoEn: '2025-01-05',
  },
  {
    id: 'referencia-musica',
    nombre: 'Música y Carnaval',
    descripcion: 'Cumbia, sonoridades del Caribe, patrimonio inmaterial y memorias festivas.',
    totalLibros: 22,
    creadoEn: '2025-01-04',
    actualizadoEn: '2025-01-04',
  },
  {
    id: 'referencia-arte',
    nombre: 'Arte',
    descripcion: 'Pintura, escultura, catálogos de exposiciones y artistas del Caribe colombiano.',
    totalLibros: 18,
    creadoEn: '2025-01-03',
    actualizadoEn: '2025-01-03',
  },
  {
    id: 'referencia-hemeroteca',
    nombre: 'Hemeroteca',
    descripcion: 'Periódicos del siglo XIX y XX, publicaciones seriadas y boletines oficiales.',
    totalLibros: 21,
    creadoEn: '2025-01-02',
    actualizadoEn: '2025-01-02',
  },
  {
    id: 'referencia-infantil',
    nombre: 'Infantil y Juvenil',
    descripcion: 'Cuentos ilustrados, fábulas, novelas juveniles y material lúdico formativo.',
    totalLibros: 14,
    creadoEn: '2025-01-01',
    actualizadoEn: '2025-01-01',
  },
];

export function ExplorarPage() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [topics, setTopics] = useState<TemaDto[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [usingFallback, setUsingFallback] = useState(false);
  const [retryToken, setRetryToken] = useState(0);
  const [sortOrder, setSortOrder] = useState<'recent' | 'alphabetical'>('recent');

  useEffect(() => {
    const controller = new AbortController();
    setStatus('loading');
    void listarTemas(controller.signal)
      .then((page) => {
        setTopics(page.items);
        setUsingFallback(false);
        setStatus('ready');
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setTopics(COLECCIONES_REFERENCIA);
          setUsingFallback(true);
          setStatus('ready');
        }
      });

    return () => controller.abort();
  }, [retryToken]);

  const visibleTopics = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    const filteredTopics = topics.filter((topic) => {
      const matchesQuery =
        !normalizedQuery ||
        topic.nombre.toLocaleLowerCase().includes(normalizedQuery) ||
        topic.descripcion?.toLocaleLowerCase().includes(normalizedQuery);
      return matchesQuery && (!selectedId || topic.id === selectedId);
    });

    return [...filteredTopics].sort((first, second) => {
      if (sortOrder === 'alphabetical') {
        return first.nombre.localeCompare(second.nombre, 'es');
      }
      return second.creadoEn.localeCompare(first.creadoEn);
    });
  }, [query, selectedId, sortOrder, topics]);

  const totalBooks = topics.reduce((total, topic) => total + topic.totalLibros, 0);
  const selectedLabel = selectedId
    ? topics.find((topic) => topic.id === selectedId)?.nombre ?? 'Colección seleccionada'
    : 'Todas las colecciones';

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = query.trim();
    if (text.length >= 2) {
      navigate(construirUrlBusqueda({ q: text }));
    } else {
      setQuery('');
      inputRef.current?.focus();
    }
  };

  const clear = () => {
    setQuery('');
    setSelectedId(null);
    inputRef.current?.focus();
  };

  return (
    <div className={styles.page}>
      <title>Explorar colecciones · Consulta Fácil</title>
      <section className={styles.panel} aria-labelledby="explorar-titulo">
        <form className={styles.searchForm} onSubmit={submit} role="search">
          <label className="visualmente-oculto" htmlFor="explorar-busqueda">
            Buscar en colecciones y temas
          </label>
          <div className={styles.inputWrapper}>
            <Search aria-hidden="true" size={20} />
            <input
              ref={inputRef}
              aria-label="Buscar en colecciones y temas"
              autoComplete="off"
              id="explorar-busqueda"
              name="q"
              onChange={(event) => {
                setQuery(event.target.value);
                setSelectedId(null);
              }}
              placeholder="Buscar por autor, título, tema o palabra clave..."
              type="search"
              value={query}
            />
          </div>
          <Boton icono={Eraser} onClick={clear} type="button" variante="oscuro">
            Limpiar
          </Boton>
          <Boton icono={Search} type="submit">
            Buscar
          </Boton>
        </form>

        <p className={styles.eyebrow}>
          <Shapes aria-hidden="true" size={16} /> Colecciones y temas
        </p>
        {status === 'ready' ? (
          <div aria-label="Filtros de colecciones" className={styles.filters} role="group">
            <button
              aria-pressed={selectedId === null}
              className={selectedId === null ? styles.filterActive : ''}
              onClick={() => setSelectedId(null)}
              type="button"
            >
              Todas las colecciones <span>{totalBooks}</span>
            </button>
            {topics.map((topic) => (
              <button
                aria-pressed={selectedId === topic.id}
                className={selectedId === topic.id ? styles.filterActive : ''}
                key={topic.id}
                onClick={() => setSelectedId(topic.id)}
                type="button"
              >
                {topic.nombre} <span>{topic.totalLibros}</span>
              </button>
            ))}
          </div>
        ) : null}

        {status === 'loading' ? <p role="status">Cargando colecciones…</p> : null}
        {usingFallback ? (
          <div className={styles.connectionNotice} role="alert">
            <p>No pudimos conectar con el catálogo. Mostramos una vista de referencia.</p>
            <button onClick={() => setRetryToken((token) => token + 1)} type="button">
              Reintentar conexión
            </button>
          </div>
        ) : null}
        {status === 'ready' ? (
          <div className={styles.panelFooter}>
            <div className={styles.summary}>
              <h1 id="explorar-titulo">{selectedId ? `${visibleTopics.reduce((total, topic) => total + topic.totalLibros, 0)} obras en sala` : `${totalBooks} obras en sala`}</h1>
              <p>Mostrando: {selectedLabel}</p>
            </div>
            <div className={styles.controls} aria-label="Orden y filtros adicionales">
              <div className={styles.sortControl}>
                <span>Ordenar:</span>
                <button
                  aria-pressed={sortOrder === 'recent'}
                  className={sortOrder === 'recent' ? styles.controlActive : ''}
                  onClick={() => setSortOrder('recent')}
                  type="button"
                >
                  <Clock3 aria-hidden="true" size={15} /> Recientes
                </button>
                <button
                  aria-pressed={sortOrder === 'alphabetical'}
                  className={sortOrder === 'alphabetical' ? styles.controlActive : ''}
                  onClick={() => setSortOrder('alphabetical')}
                  type="button"
                >
                  <ArrowDownAZ aria-hidden="true" size={15} /> A-Z
                </button>
              </div>
              <label className={styles.materialControl}>
                <SlidersHorizontal aria-hidden="true" size={15} />
                <span className="visualmente-oculto">Tipo de material</span>
                <select aria-label="Tipo de material" defaultValue="todos">
                  <option value="todos">Todos los materiales</option>
                  <option value="libro">Libros</option>
                  <option value="revista">Revistas</option>
                  <option value="tesis">Tesis</option>
                </select>
              </label>
              <button className={styles.clearFilters} onClick={clear} type="button">
                <Eraser aria-hidden="true" size={15} /> Limpiar
              </button>
            </div>
          </div>
        ) : null}
        {status === 'ready' && visibleTopics.length === 0 ? (
          <div className={styles.emptyState} role="status">
            <h2>No encontramos colecciones con esa búsqueda</h2>
            <ul>
              <li>Revisa la ortografía.</li>
              <li>Prueba con términos más generales.</li>
              <li>Limpia la búsqueda para explorar todas las colecciones.</li>
            </ul>
          </div>
        ) : null}
      </section>

      {status === 'ready' && visibleTopics.length > 0 ? (
        <section aria-labelledby="colecciones-titulo">
          <div className={styles.resultSummary}>
            <div>
              <p className={styles.eyebrow}>Colecciones temáticas de sala</p>
              <h2 id="colecciones-titulo">Explorar por tema</h2>
              <p className={styles.sectionDescription}>Haga clic sobre una colección para activar su filtro inmediato o abrir su fondo patrimonial.</p>
            </div>
          </div>
          <ul className={styles.topicList}>
            {visibleTopics.map((topic) => {
              const isSelected = selectedId === topic.id;
              return (
                <li key={topic.id}>
                  <article className={`${styles.topicCard} ${isSelected ? styles.selected : ''}`}>
                    <span className={styles.topicIcon} aria-hidden="true"><BookOpen size={22} /></span>
                    <div className={styles.topicContent}>
                      <p className={styles.topicMeta}>{topic.totalLibros} {topic.totalLibros === 1 ? 'título' : 'títulos'}</p>
                      <h3>{topic.nombre}</h3>
                      <p>{topic.descripcion ?? 'Obras relacionadas disponibles en el catálogo.'}</p>
                    </div>
                    <Link
                      aria-label={`Filtrar colección ${topic.nombre}`}
                      className={styles.topicAction}
                      onClick={() => setSelectedId(topic.id)}
                      to={construirUrlBusqueda({ q: topic.nombre })}
                    >
                      Filtrar colección <ArrowRight aria-hidden="true" size={18} />
                    </Link>
                  </article>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <div className={styles.help}>
        <Link to={RUTAS.inicio}>Volver al inicio</Link>
        <span>¿Necesitas orientación?</span>
        <Link to={{ pathname: RUTAS.inicio, hash: '#ayuda-titulo' }}>Pedir ayuda <ArrowRight aria-hidden="true" size={18} /></Link>
      </div>
    </div>
  );
}
