import { useEffect, useState, type FormEvent } from 'react';
import { ArrowLeft, Pencil, Plus, RotateCw, Search, Trash2, X } from 'lucide-react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { normalizarError } from '../../api/errores';
import { RUTAS, rutaPanelLibro } from '../../config/rutas';
import { useConsulta } from '../../shared/hooks/useConsulta';
import { Boton } from '../../shared/ui/Boton';
import { Paginacion } from '../busqueda/components/Paginacion';
import { NOMBRE_FORMATO, NOMBRE_TIPO_MATERIAL, listaNombres } from '../catalogo/etiquetas';
import type { FormatoMaterial, LibroDto, TipoMaterial } from '../catalogo/types';
import { eliminarLibro, listarLibrosPanel, type Direccion, type OrdenLibros } from './api/catalogo-admin.api';
import styles from './components/GestionCatalogo.module.css';

export const LIBROS_POR_PAGINA = 20;

const ORDENES: { valor: string; etiqueta: string; ordenarPor: OrdenLibros; direccion: Direccion }[] = [
  { valor: 'titulo-asc', etiqueta: 'Título (A-Z)', ordenarPor: 'titulo', direccion: 'asc' },
  { valor: 'titulo-desc', etiqueta: 'Título (Z-A)', ordenarPor: 'titulo', direccion: 'desc' },
  { valor: 'anio-desc', etiqueta: 'Año (más nuevos)', ordenarPor: 'anio', direccion: 'desc' },
  { valor: 'anio-asc', etiqueta: 'Año (más antiguos)', ordenarPor: 'anio', direccion: 'asc' },
  { valor: 'creadoEn-desc', etiqueta: 'Registrados recientemente', ordenarPor: 'creadoEn', direccion: 'desc' },
];

const esFormato = (v: string | null): v is FormatoMaterial => !!v && v in NOMBRE_FORMATO;
const esTipo = (v: string | null): v is TipoMaterial => !!v && v in NOMBRE_TIPO_MATERIAL;

/** HU-25: el personal busca, ordena y administra los libros del catálogo. */
export function LibrosPanelPage() {
  const [params, setParams] = useSearchParams();
  const { pathname, state } = useLocation();
  const texto = (params.get('q') ?? '').trim();
  const formato = esFormato(params.get('formato')) ? (params.get('formato') as FormatoMaterial) : undefined;
  const tipo = esTipo(params.get('tipo')) ? (params.get('tipo') as TipoMaterial) : undefined;
  const orden = ORDENES.find((o) => o.valor === params.get('orden')) ?? ORDENES[0];
  const paginaUrl = Number(params.get('pagina'));
  const pagina = Number.isInteger(paginaUrl) && paginaUrl > 1 ? paginaUrl : 1;

  const consulta = useConsulta(`${texto}|${formato}|${tipo}|${orden.valor}|${pagina}`, (signal) =>
    listarLibrosPanel(
      {
        pagina,
        tamano: LIBROS_POR_PAGINA,
        texto: texto || undefined,
        formato,
        tipoMaterial: tipo,
        ordenarPor: orden.ordenarPor,
        direccion: orden.direccion,
      },
      signal,
    ),
  );

  const [textoFiltro, setTextoFiltro] = useState(texto);
  const [confirmando, setConfirmando] = useState<string | null>(null);
  const [eliminando, setEliminando] = useState(false);
  // Aviso que llega al volver de crear o editar un libro.
  const [aviso, setAviso] = useState((state as { aviso?: string } | null)?.aviso ?? '');
  const [errorAccion, setErrorAccion] = useState<string | null>(null);

  useEffect(() => setTextoFiltro(texto), [texto]);

  const actualizarUrl = (cambios: Record<string, string | null | undefined>) => {
    const siguiente = new URLSearchParams(params);
    for (const [clave, valor] of Object.entries(cambios)) {
      if (valor) siguiente.set(clave, valor);
      else siguiente.delete(clave);
    }
    siguiente.delete('pagina');
    setParams(siguiente);
  };

  const urlDePagina = (n: number) => {
    const siguiente = new URLSearchParams(params);
    if (n > 1) siguiente.set('pagina', String(n));
    else siguiente.delete('pagina');
    const consultaUrl = siguiente.toString();
    return consultaUrl ? `${pathname}?${consultaUrl}` : pathname;
  };

  const filtrar = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    actualizarUrl({ q: textoFiltro.trim() || null });
  };

  const confirmarEliminacion = async (libro: LibroDto) => {
    setEliminando(true);
    setErrorAccion(null);
    try {
      await eliminarLibro(libro.id);
      setAviso(`Libro «${libro.titulo}» eliminado.`);
      consulta.reintentar();
    } catch (error) {
      setErrorAccion(normalizarError(error).mensaje);
    } finally {
      setEliminando(false);
      setConfirmando(null);
    }
  };

  const hayFiltros = Boolean(texto || formato || tipo);

  return (
    <section aria-labelledby="libros-titulo" className={styles.pagina}>
      <title>Libros · Panel · Consulta Fácil</title>
      <Link className={styles.volver} to={RUTAS.panel}>
        <ArrowLeft aria-hidden="true" size={20} />
        Volver al panel
      </Link>
      <header className={styles.cabecera}>
        <div>
          <h1 id="libros-titulo">Libros</h1>
          <p>Registra libros y sus ejemplares. Un libro con ejemplares no se puede eliminar.</p>
        </div>
        <Link className={styles.enlacePrincipal} to={RUTAS.panelLibroNuevo}>
          <Plus aria-hidden="true" size={20} />
          Nuevo libro
        </Link>
      </header>

      <p aria-live="polite" className={styles.aviso}>
        {aviso}
      </p>
      {errorAccion ? (
        <p className={styles.errorAccion} role="alert">
          {errorAccion}
        </p>
      ) : null}

      <div className={styles.herramientas}>
        <form className={styles.filtro} onSubmit={filtrar} role="search">
          <label htmlFor="filtro-titulo">Buscar por título</label>
          <div>
            <input
              id="filtro-titulo"
              maxLength={100}
              onChange={(e) => setTextoFiltro(e.target.value)}
              type="search"
              value={textoFiltro}
            />
            <Boton icono={Search} type="submit" variante="oscuro">
              Buscar
            </Boton>
            {hayFiltros ? (
              <button
                className={styles.limpiar}
                onClick={() => actualizarUrl({ q: null, formato: null, tipo: null })}
                type="button"
              >
                <X aria-hidden="true" size={18} /> Limpiar filtros
              </button>
            ) : null}
          </div>
        </form>
        <div className={styles.orden}>
          <label htmlFor="filtro-formato">Formato</label>
          <select id="filtro-formato" onChange={(e) => actualizarUrl({ formato: e.target.value })} value={formato ?? ''}>
            <option value="">Todos</option>
            {(Object.keys(NOMBRE_FORMATO) as FormatoMaterial[]).map((f) => (
              <option key={f} value={f}>
                {NOMBRE_FORMATO[f]}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.orden}>
          <label htmlFor="filtro-tipo">Tipo de material</label>
          <select id="filtro-tipo" onChange={(e) => actualizarUrl({ tipo: e.target.value })} value={tipo ?? ''}>
            <option value="">Todos</option>
            {(Object.keys(NOMBRE_TIPO_MATERIAL) as TipoMaterial[]).map((t) => (
              <option key={t} value={t}>
                {NOMBRE_TIPO_MATERIAL[t]}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.orden}>
          <label htmlFor="orden">Ordenar por</label>
          <select
            id="orden"
            onChange={(e) => actualizarUrl({ orden: e.target.value === ORDENES[0].valor ? null : e.target.value })}
            value={orden.valor}
          >
            {ORDENES.map((o) => (
              <option key={o.valor} value={o.valor}>
                {o.etiqueta}
              </option>
            ))}
          </select>
        </div>
      </div>

      {consulta.estado === 'cargando' ? (
        <p role="status">Cargando…</p>
      ) : consulta.estado === 'error' ? (
        <div className={styles.errorCarga} role="alert">
          <p>No se pudo cargar el listado: {consulta.error.mensaje}</p>
          <Boton icono={RotateCw} onClick={consulta.reintentar} variante="oscuro">
            Intentar de nuevo
          </Boton>
        </div>
      ) : (
        <>
          <div className={styles.tablaContenedor}>
            <table className={styles.tabla}>
              <caption>
                {consulta.datos.total === 0
                  ? hayFiltros
                    ? 'No hay libros con esos filtros.'
                    : 'Todavía no hay libros.'
                  : `${consulta.datos.total} ${consulta.datos.total === 1 ? 'libro' : 'libros'}${hayFiltros ? ' con esos filtros' : ''}`}
              </caption>
              <thead>
                <tr>
                  <th scope="col">Título</th>
                  <th scope="col">Autores</th>
                  <th className={styles.numero} scope="col">
                    Año
                  </th>
                  <th scope="col">Formato</th>
                  <th scope="col">
                    <span className="visualmente-oculto">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {consulta.datos.items.map((libro) =>
                  confirmando === libro.id ? (
                    <tr className={styles.confirmar} key={libro.id}>
                      <td colSpan={5}>
                        <p id={`confirmar-${libro.id}`}>
                          ¿Eliminar el libro «{libro.titulo}»? Esta acción no se puede deshacer.
                        </p>
                        <div className={styles.acciones}>
                          <button
                            aria-describedby={`confirmar-${libro.id}`}
                            className={styles.peligro}
                            disabled={eliminando}
                            onClick={() => void confirmarEliminacion(libro)}
                            type="button"
                          >
                            <Trash2 aria-hidden="true" size={18} /> Sí, eliminar
                          </button>
                          <button className={styles.secundario} onClick={() => setConfirmando(null)} type="button">
                            Cancelar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr key={libro.id}>
                      <th scope="row">{libro.titulo}</th>
                      <td className={styles.descripcion}>{listaNombres(libro.autores)}</td>
                      <td className={styles.numero}>{libro.anioPublicacion ?? '—'}</td>
                      <td>{NOMBRE_FORMATO[libro.formato]}</td>
                      <td>
                        <div className={styles.acciones}>
                          <Link
                            aria-label={`Editar ${libro.titulo}`}
                            className={styles.secundario}
                            to={rutaPanelLibro(libro.id)}
                          >
                            <Pencil aria-hidden="true" size={18} /> Editar
                          </Link>
                          <button
                            aria-label={`Eliminar ${libro.titulo}`}
                            className={styles.secundario}
                            onClick={() => {
                              setConfirmando(libro.id);
                              setErrorAccion(null);
                              setAviso('');
                            }}
                            type="button"
                          >
                            <Trash2 aria-hidden="true" size={18} /> Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
          <Paginacion
            pagina={consulta.datos.pagina}
            totalPaginas={Math.ceil(consulta.datos.total / consulta.datos.tamano)}
            urlDePagina={urlDePagina}
          />
        </>
      )}
    </section>
  );
}
