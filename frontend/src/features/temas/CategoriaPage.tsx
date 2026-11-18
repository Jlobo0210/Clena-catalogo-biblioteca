import { useEffect, useRef } from 'react';
import { ArrowLeft, CircleAlert, Eraser, RotateCw, Shapes, SlidersHorizontal } from 'lucide-react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { RUTAS } from '../../config/rutas';
import { useConsulta } from '../../shared/hooks/useConsulta';
import { Boton } from '../../shared/ui/Boton';
import type { FiltrosBusqueda } from '../busqueda/api/busqueda.api';
import { Paginacion } from '../busqueda/components/Paginacion';
import { PanelFiltros } from '../busqueda/components/PanelFiltros';
import { ResultadoLibro } from '../busqueda/components/ResultadoLibro';
import { listarLibrosDeTema, obtenerTema } from './api/categorias.api';
import {
  construirUrlCategoria,
  hayFiltrosActivos,
  leerFiltrosCategoria,
  type FiltrosCategoria,
} from './parametrosCategoria';
import styles from './CategoriaPage.module.css';

export const LIBROS_POR_PAGINA = 10;

const ORDENES_CATEGORIA: { valor: 'titulo' | 'anio'; etiqueta: string }[] = [
  { valor: 'titulo', etiqueta: 'Título (A–Z)' },
  { valor: 'anio', etiqueta: 'Año (más reciente)' },
];

const formatoNumero = new Intl.NumberFormat('es-CO');

function libros(n: number): string {
  return `${formatoNumero.format(n)} ${n === 1 ? 'libro' : 'libros'}`;
}

/**
 * HU-35: libros de una categoría temática, con los mismos filtros de la búsqueda
 * (tipo, idioma, años, disponibilidad y orden). Los filtros viven en la URL.
 */
export function CategoriaPage() {
  const { id = '' } = useParams();
  const [params] = useSearchParams();
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const { filtros, pagina } = leerFiltrosCategoria(params);

  const tema = useConsulta(id, (signal) => obtenerTema(id, signal));
  const resultados = useConsulta(
    `${id}|${pagina}|${JSON.stringify(filtros)}`,
    (signal) =>
      listarLibrosDeTema(id, filtros, { pagina, tamano: LIBROS_POR_PAGINA }, signal),
  );

  // Al cambiar de página, el foco va al título de los resultados (como en la búsqueda).
  const tituloRef = useRef<HTMLHeadingElement>(null);
  const paginaAnterior = useRef(pagina);
  useEffect(() => {
    if (resultados.estado === 'listo' && paginaAnterior.current !== pagina) {
      paginaAnterior.current = pagina;
      tituloRef.current?.focus();
    }
  }, [resultados.estado, pagina]);

  const actualizarFiltros = (cambios: Partial<FiltrosBusqueda>) => {
    const siguientes: FiltrosCategoria = {
      ...filtros,
      ...('idioma' in cambios ? { idioma: cambios.idioma } : {}),
      ...('tipoMaterial' in cambios ? { tipoMaterial: cambios.tipoMaterial } : {}),
      ...('anioDesde' in cambios ? { anioDesde: cambios.anioDesde } : {}),
      ...('anioHasta' in cambios ? { anioHasta: cambios.anioHasta } : {}),
      ...('soloDisponibles' in cambios
        ? { soloDisponibles: Boolean(cambios.soloDisponibles) }
        : {}),
      ...(cambios.ordenarPor === 'anio' || cambios.ordenarPor === 'titulo'
        ? { ordenarPor: cambios.ordenarPor }
        : {}),
    };
    navigate(construirUrlCategoria(id, siguientes), { replace: true });
  };

  const quitarFiltros = () =>
    navigate(
      construirUrlCategoria(id, { soloDisponibles: false, ordenarPor: filtros.ordenarPor }),
      { replace: true },
    );

  // Un id que no existe (404) o que no es un id válido (400).
  if (
    tema.estado === 'error' &&
    (tema.error.tipo === 'no-encontrado' || tema.error.tipo === 'validacion')
  ) {
    return (
      <div className={styles.pagina}>
        <title>Categoría no encontrada · Consulta Fácil</title>
        <section className={styles.aviso} aria-labelledby="categoria-titulo">
          <h1 id="categoria-titulo">No encontramos esta categoría</h1>
          <p>Puede que la hayan renombrado o eliminado del catálogo.</p>
          <Link to={RUTAS.temas}>
            <ArrowLeft aria-hidden="true" size={18} /> Ver todas las categorías
          </Link>
        </section>
      </div>
    );
  }

  const nombre = tema.estado === 'listo' ? tema.datos.nombre : null;
  const conFiltros = hayFiltrosActivos(filtros);

  return (
    <div className={styles.pagina}>
      <title>{nombre ? `${nombre} · Categorías · Consulta Fácil` : 'Categoría · Consulta Fácil'}</title>

      <nav aria-label="Ruta de navegación" className={styles.migas}>
        <Link to={RUTAS.temas}>
          <ArrowLeft aria-hidden="true" size={18} /> Todas las categorías
        </Link>
      </nav>

      <section aria-labelledby="categoria-titulo" className={styles.franja}>
        <p className={styles.antetitulo}>
          <Shapes aria-hidden="true" size={16} /> Categoría
        </p>
        <h1 id="categoria-titulo">{nombre ?? (tema.estado === 'error' ? 'Categoría' : 'Cargando categoría…')}</h1>
        {tema.estado === 'listo' && tema.datos.descripcion ? (
          <p className={styles.descripcion}>{tema.datos.descripcion}</p>
        ) : null}
      </section>

      <div className={styles.cuerpo}>
        <div className={styles.columnaFiltros}>
          <div className={styles.filtrosEncabezado}>
            <SlidersHorizontal aria-hidden="true" size={18} />
            <span>Filtros</span>
          </div>
          <PanelFiltros
            filtros={{ q: '', ...filtros }}
            onChange={actualizarFiltros}
            ordenes={ORDENES_CATEGORIA}
          />
          {conFiltros ? (
            <Boton icono={Eraser} onClick={quitarFiltros} variante="oscuro">
              Quitar filtros
            </Boton>
          ) : null}
        </div>

        <section
          aria-busy={resultados.estado === 'cargando'}
          aria-labelledby="resultados-titulo"
          className={styles.resultados}
        >
          {resultados.estado === 'cargando' ? (
            <h2 id="resultados-titulo">Cargando libros…</h2>
          ) : resultados.estado === 'error' ? (
            <div className={styles.error} role="alert">
              <h2 id="resultados-titulo">
                <CircleAlert aria-hidden="true" size={24} />
                No pudimos cargar los libros de esta categoría
              </h2>
              <p>{resultados.error.mensaje}</p>
              <Boton icono={RotateCw} onClick={resultados.reintentar} variante="oscuro">
                Intentar de nuevo
              </Boton>
            </div>
          ) : resultados.datos.total === 0 ? (
            <div className={styles.vacio}>
              <h2 id="resultados-titulo">
                {conFiltros
                  ? 'Ningún libro de esta categoría coincide con los filtros'
                  : 'Esta categoría todavía no tiene libros'}
              </h2>
              {conFiltros ? (
                <p>Pruebe quitando algún filtro, por ejemplo «Solo con ejemplares disponibles».</p>
              ) : (
                <p>
                  Explore <Link to={RUTAS.temas}>otras categorías</Link> o use la{' '}
                  <Link to={RUTAS.buscar}>búsqueda general</Link>.
                </p>
              )}
            </div>
          ) : (
            <>
              <h2 className={styles.titulo} id="resultados-titulo" ref={tituloRef} tabIndex={-1}>
                {libros(resultados.datos.total)}
                {nombre ? ` en «${nombre}»` : ''}
                {conFiltros ? ' con los filtros activos' : ''}
              </h2>
              <p className={styles.orden}>
                {filtros.ordenarPor === 'anio'
                  ? 'Ordenados del más reciente al más antiguo.'
                  : 'Ordenados por título, de la A a la Z.'}
              </p>
              <ol className={styles.lista}>
                {resultados.datos.items.map((libro) => (
                  <ResultadoLibro desde={`${pathname}${search}`} key={libro.id} libro={libro} />
                ))}
              </ol>
              <Paginacion
                pagina={resultados.datos.pagina}
                totalPaginas={Math.ceil(resultados.datos.total / resultados.datos.tamano)}
                urlDePagina={(n) => construirUrlCategoria(id, filtros, n)}
              />
            </>
          )}

          {/* Anuncio para lectores de pantalla */}
          <p className="visualmente-oculto" role="status">
            {resultados.estado === 'listo'
              ? resultados.datos.total === 0
                ? 'No hay libros para mostrar.'
                : `${libros(resultados.datos.total)}${nombre ? ` en ${nombre}` : ''}. Página ${resultados.datos.pagina}.`
              : ''}
          </p>
        </section>
      </div>
    </div>
  );
}
