import { useEffect, useRef } from 'react';
import { CircleAlert, Info, RotateCw } from 'lucide-react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { Boton } from '../../shared/ui/Boton';
import { useConsulta } from '../../shared/hooks/useConsulta';
import { buscarLibros } from '../catalogo/api/libros.api';
import { etiquetaAmbito } from './ambitos';
import { FormularioBusqueda } from './components/FormularioBusqueda';
import { Paginacion } from './components/Paginacion';
import { ResultadoLibro } from './components/ResultadoLibro';
import { SinResultados } from './components/SinResultados';
import { construirUrlBusqueda, leerParametrosBusqueda } from './parametrosBusqueda';
import styles from './BusquedaPage.module.css';

export const RESULTADOS_POR_PAGINA = 10;
/** El backend pide al menos 2 caracteres para buscar (HU-20). */
const MINIMO_CARACTERES = 2;

const formatoNumero = new Intl.NumberFormat('es-CO');

/** HU-24: resultados de la búsqueda simple, paginados y fáciles de leer. */
export function BusquedaPage() {
  const [params] = useSearchParams();
  const { pathname, search } = useLocation();
  const { ambito, pagina, q } = leerParametrosBusqueda(params);
  const texto = q.trim();
  const puedeBuscar = texto.length >= MINIMO_CARACTERES;

  const consulta = useConsulta(
    `${texto}|${pagina}`,
    puedeBuscar
      ? (signal) => buscarLibros({ q: texto, pagina, tamano: RESULTADOS_POR_PAGINA }, signal)
      : null,
  );

  // Al cambiar de página, el foco va al título de los resultados (y no se queda abajo, en la paginación).
  const tituloRef = useRef<HTMLHeadingElement>(null);
  const paginaAnterior = useRef(pagina);
  useEffect(() => {
    if (consulta.estado === 'listo' && paginaAnterior.current !== pagina) {
      paginaAnterior.current = pagina;
      tituloRef.current?.focus();
    }
  }, [consulta.estado, pagina]);

  const urlDePagina = (n: number) => construirUrlBusqueda({ ambito, pagina: n, q: texto });

  return (
    <div className={styles.pagina}>
      <title>{texto ? `«${texto}» · Resultados de búsqueda · Consulta Fácil` : 'Buscar · Consulta Fácil'}</title>
      <section aria-labelledby="buscar-titulo" className={styles.franja}>
        <h1 id="buscar-titulo">Buscar libros</h1>
        {/* key: si cambia la búsqueda en la URL, el formulario vuelve a empezar con ese texto. */}
        <FormularioBusqueda ambitoInicial={ambito} key={`${texto}|${ambito}`} textoInicial={texto} />
      </section>

      {ambito !== 'todo' ? (
        <p className={styles.nota}>
          <Info aria-hidden="true" size={20} />
          Pronto podrá buscar solo en «{etiquetaAmbito(ambito)}». Por ahora se busca en todo el catálogo.
        </p>
      ) : null}

      <section
        aria-busy={consulta.estado === 'cargando' && puedeBuscar}
        aria-labelledby="resultados-titulo"
        className={styles.resultados}
      >
        {!texto ? (
          <>
            <h2 id="resultados-titulo">¿Qué libro busca?</h2>
            <p>Escriba un título, un autor o un tema en el campo de arriba y presione «Buscar en catálogo».</p>
          </>
        ) : !puedeBuscar ? (
          <>
            <h2 id="resultados-titulo">Escriba un poco más</h2>
            <p>Para buscar, escriba al menos {MINIMO_CARACTERES} letras.</p>
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
            <Boton icono={RotateCw} onClick={consulta.reintentar} variante="oscuro">
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
            <h2 className={styles.titulo} id="resultados-titulo" ref={tituloRef} tabIndex={-1}>
              {formatoNumero.format(consulta.datos.total)}{' '}
              {consulta.datos.total === 1 ? 'resultado' : 'resultados'} para «{texto}»
            </h2>
            <p className={styles.orden}>Ordenados del más al menos relevante.</p>
            <ol className={styles.lista}>
              {consulta.datos.items.map((libro) => (
                <ResultadoLibro desde={`${pathname}${search}`} key={libro.id} libro={libro} />
              ))}
            </ol>
            <Paginacion
              pagina={consulta.datos.pagina}
              totalPaginas={Math.ceil(consulta.datos.total / consulta.datos.tamano)}
              urlDePagina={urlDePagina}
            />
          </>
        )}
        {/* Anuncio para lectores de pantalla cuando llegan los resultados. */}
        <p className="visualmente-oculto" role="status">
          {consulta.estado === 'listo' && puedeBuscar
            ? consulta.datos.total === 0
              ? `No se encontraron libros para ${texto}.`
              : consulta.datos.total === 1
                ? `Se encontró 1 libro para ${texto}.`
                : `Se encontraron ${consulta.datos.total} libros para ${texto}. Página ${consulta.datos.pagina}.`
            : ''}
        </p>
      </section>
    </div>
  );
}
