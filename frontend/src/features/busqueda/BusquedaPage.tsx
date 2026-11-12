import { useCallback, useEffect, useRef } from 'react';
import { CircleAlert, Info, RotateCw, SlidersHorizontal } from 'lucide-react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Boton } from '../../shared/ui/Boton';
import { useConsulta } from '../../shared/hooks/useConsulta';
import { etiquetaAmbito } from './ambitos';
import type { FiltrosBusqueda } from './api/busqueda.api';
import { buscarLibros } from './api/busqueda.api';
import { FormularioBusqueda } from './components/FormularioBusqueda';
import { PanelFiltros } from './components/PanelFiltros';
import { Paginacion } from './components/Paginacion';
import { ResultadoLibro } from './components/ResultadoLibro';
import { SinResultados } from './components/SinResultados';
import {
  construirUrlConFiltros,
  leerFiltrosDeUrl,
  leerParametrosBusqueda,
} from './parametrosBusqueda';
import styles from './BusquedaPage.module.css';

export const RESULTADOS_POR_PAGINA = 10;
/** El backend pide al menos 2 caracteres para buscar (HU-20). */
const MINIMO_CARACTERES = 2;

const formatoNumero = new Intl.NumberFormat('es-CO');

/** HU-22 + HU-24: búsqueda con filtros, paginación y resultados accesibles. */
export function BusquedaPage() {
  const [params] = useSearchParams();
  const { pathname, search } = useLocation();
  const navigate = useNavigate();

  // HU-24: ámbito y texto del buscador
  const { ambito, q } = leerParametrosBusqueda(params);
  // HU-22: filtros de refinamiento (idioma, tipo, año…) + pagina
  const filtros = leerFiltrosDeUrl(params);
  const pagina = filtros.pagina ?? 1;

  const texto = q.trim();
  const puedeBuscar = texto.length >= MINIMO_CARACTERES;

  // useConsulta de HU-24, con los parámetros de filtro de HU-22
  const consulta = useConsulta(
    `${texto}|${pagina}|${JSON.stringify(filtros)}`,
    puedeBuscar
      ? (signal) =>
          buscarLibros(
            { ...filtros, q: texto, pagina, tamano: RESULTADOS_POR_PAGINA },
            signal,
          )
      : null,
  );

  // HU-24: al cambiar de página el foco va al título de los resultados
  const tituloRef = useRef<HTMLHeadingElement>(null);
  const paginaAnterior = useRef(pagina);
  useEffect(() => {
    if (consulta.estado === 'listo' && paginaAnterior.current !== pagina) {
      paginaAnterior.current = pagina;
      tituloRef.current?.focus();
    }
  }, [consulta.estado, pagina]);

  // HU-22: actualizar filtros y volver a la página 1
  const actualizarFiltros = useCallback(
    (cambios: Partial<FiltrosBusqueda>) => {
      navigate(construirUrlConFiltros({ ...filtros, ...cambios }, 1), {
        replace: true,
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [params, navigate],
  );

  // HU-22+24: URL de paginación que preserva todos los filtros activos
  const urlDePagina = (n: number) =>
    construirUrlConFiltros({ ...filtros, q: texto }, n);

  const hayFiltrosActivos = Boolean(
    filtros.idioma ||
      filtros.tipoMaterial ||
      filtros.temaId ||
      filtros.anioDesde ||
      filtros.anioHasta ||
      filtros.soloDisponibles,
  );

  return (
    <div className={styles.pagina}>
      <title>
        {texto
          ? `«${texto}» · Resultados de búsqueda · Consulta Fácil`
          : 'Buscar · Consulta Fácil'}
      </title>

      {/* HU-24: franja de búsqueda */}
      <section aria-labelledby="buscar-titulo" className={styles.franja}>
        <h1 id="buscar-titulo">Buscar libros</h1>
        <FormularioBusqueda
          ambitoInicial={ambito}
          key={`${texto}|${ambito}`}
          textoInicial={texto}
        />
      </section>

      {ambito !== 'todo' ? (
        <p className={styles.nota}>
          <Info aria-hidden="true" size={20} />
          Pronto podrá buscar solo en «{etiquetaAmbito(ambito)}». Por ahora se
          busca en todo el catálogo.
        </p>
      ) : null}

      {/* HU-22: layout de dos columnas — filtros | resultados */}
      <div className={styles.cuerpo}>
        <div className={styles.columnaFiltros}>
          <div className={styles.filtrosHeader}>
            <SlidersHorizontal aria-hidden="true" size={18} />
            <span>Filtros</span>
          </div>
          <PanelFiltros filtros={filtros} onChange={actualizarFiltros} />
        </div>

        <section
          aria-busy={consulta.estado === 'cargando' && puedeBuscar}
          aria-labelledby="resultados-titulo"
          className={styles.resultados}
        >
          {!texto ? (
            <>
              <h2 id="resultados-titulo">¿Qué libro busca?</h2>
              <p>
                Escriba un título, un autor o un tema en el campo de arriba y
                presione «Buscar en catálogo».
              </p>
            </>
          ) : !puedeBuscar ? (
            <>
              <h2 id="resultados-titulo">Escriba un poco más</h2>
              <p>
                Para buscar, escriba al menos {MINIMO_CARACTERES} letras.
              </p>
            </>
          ) : consulta.estado === 'cargando' ? (
            <h2 id="resultados-titulo">Buscando «{texto}»…</h2>
          ) : consulta.estado === 'error' ? (
            <div className={styles.error} role="alert">
              <h2 id="resultados-titulo">
                <CircleAlert aria-hidden="true" size={24} />
                No pudimos completar la búsqueda
              </h2>
              <p>{consulta.error.mensaje}</p>
              <Boton
                icono={RotateCw}
                onClick={consulta.reintentar}
                variante="oscuro"
              >
                Intentar de nuevo
              </Boton>
            </div>
          ) : consulta.datos.total === 0 ? (
            <>
              <span className="visualmente-oculto" id="resultados-titulo">
                Sin resultados
              </span>
              <SinResultados q={texto} />
            </>
          ) : (
            <>
              <h2
                className={styles.titulo}
                id="resultados-titulo"
                ref={tituloRef}
                tabIndex={-1}
              >
                {formatoNumero.format(consulta.datos.total)}{' '}
                {consulta.datos.total === 1 ? 'resultado' : 'resultados'} para
                «{texto}»
                {hayFiltrosActivos ? ' con los filtros activos' : ''}
              </h2>
              <p className={styles.orden}>
                Ordenados del más al menos relevante.
              </p>
              <ol className={styles.lista}>
                {consulta.datos.items.map((libro) => (
                  <ResultadoLibro
                    desde={`${pathname}${search}`}
                    key={libro.id}
                    libro={libro}
                  />
                ))}
              </ol>
              <Paginacion
                pagina={consulta.datos.pagina}
                totalPaginas={Math.ceil(
                  consulta.datos.total / consulta.datos.tamano,
                )}
                urlDePagina={urlDePagina}
              />
            </>
          )}

          {/* HU-24: anuncio para lectores de pantalla */}
          <p className="visualmente-oculto" role="status">
            {consulta.estado === 'listo' && puedeBuscar
              ? consulta.datos.total === 0
                ? `No se encontraron libros para ${texto}.`
                : consulta.datos.total === 1
                  ? `Se encontró 1 libro para ${texto}.`
                  : `Se encontraron ${consulta.datos.total} libros para ${texto}. Página ${pagina}.`
              : ''}
          </p>
        </section>
      </div>
    </div>
  );
}