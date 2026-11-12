import { useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SlidersHorizontal } from 'lucide-react';
import type { FiltrosBusqueda } from './api/busqueda.api';
import { useBusqueda } from './hooks/useBusqueda';
import { construirUrlConFiltros, leerFiltrosDeUrl } from './parametrosBusqueda';
import { PanelFiltros } from './components/PanelFiltros';
import { TarjetaLibro } from './components/TarjetaLibro';
import { PaginadorBusqueda } from './components/PaginadorBusqueda';
import styles from './BusquedaPage.module.css';

export function BusquedaPage() {
  const tamano = 20;

  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();

  const filtros = leerFiltrosDeUrl(params);
  const pagina = filtros.pagina ?? 1;

  const { datos, cargando, error } = useBusqueda(filtros, pagina);

  const totalPaginas = datos ? Math.ceil(datos.total / tamano) : 0;

  const hayFiltrosActivos = Boolean(
    filtros.idioma ||
      filtros.tipoMaterial ||
      filtros.temaId ||
      filtros.anioDesde ||
      filtros.anioHasta ||
      filtros.soloDisponibles,
  );

  const actualizarFiltros = useCallback(
    (cambios: Partial<FiltrosBusqueda>) => {
      const nuevosFiltros = { ...filtros, ...cambios };
      navigate(construirUrlConFiltros(nuevosFiltros, 1), { replace: true });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [params, navigate],
  );

  const cambiarPagina = useCallback(
    (nuevaPagina: number) => {
      setParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('pagina', String(nuevaPagina));
        return next;
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [setParams],
  );

  return (
    <div className={styles.pagina}>
      <section
        className={styles.encabezado}
        aria-labelledby="resultados-titulo"
      >
        <h1 className={styles.tituloPagina} id="resultados-titulo">
          {filtros.q ? (
            <>
              Resultados para <em>«{filtros.q}»</em>
            </>
          ) : (
            'Búsqueda'
          )}
        </h1>
        {datos && (
          <p className={styles.conteo}>
            {datos.total === 0
              ? 'Sin resultados'
              : `${datos.total} resultado${datos.total === 1 ? '' : 's'}`}
            {hayFiltrosActivos ? ' con los filtros activos' : ''}
          </p>
        )}
      </section>

      <div className={styles.cuerpo}>
        <div className={styles.columnaFiltros}>
          <div className={styles.filtrosHeader}>
            <SlidersHorizontal aria-hidden="true" size={18} />
            <span>Filtros</span>
          </div>
          <PanelFiltros filtros={filtros} onChange={actualizarFiltros} />
        </div>

        <main
          className={styles.resultados}
          aria-live="polite"
          aria-busy={cargando}
        >
          {cargando ? (
            <p className={styles.estado}>Buscando…</p>
          ) : error ? (
            <p className={styles.estadoError} role="alert">
              {error}
            </p>
          ) : !filtros.q || filtros.q.trim().length < 2 ? (
            <p className={styles.estado}>
              Escribe al menos 2 caracteres para buscar.
            </p>
          ) : datos && datos.items.length === 0 ? (
            <p className={styles.estado}>
              No se encontraron materiales que coincidan con tu búsqueda. Intenta
              con otras palabras o ajusta los filtros.
            </p>
          ) : datos ? (
            <>
              <ul
                className={styles.lista}
                aria-label="Resultados de búsqueda"
              >
                {datos.items.map((libro) => (
                  <li key={libro.id}>
                    <TarjetaLibro libro={libro} />
                  </li>
                ))}
              </ul>
              <PaginadorBusqueda
                onCambiar={cambiarPagina}
                paginaActual={pagina}
                totalPaginas={totalPaginas}
              />
            </>
          ) : null}
        </main>
      </div>
    </div>
  );
}
