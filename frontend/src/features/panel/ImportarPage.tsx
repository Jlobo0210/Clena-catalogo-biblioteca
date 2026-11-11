import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { ArrowLeft, CircleAlert, Download, FileUp, TriangleAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import { normalizarError } from '../../api/errores';
import { RUTAS } from '../../config/rutas';
import { Boton } from '../../shared/ui/Boton';
import { descargarPlantilla, importarCatalogo, type ReporteImportacion } from './api/catalogo-admin.api';
import estilosGestion from './components/GestionCatalogo.module.css';
import styles from './ImportarPage.module.css';

const TAMANO_MAXIMO = 2 * 1024 * 1024;
const formatoNumero = new Intl.NumberFormat('es-CO');

/** HU-25: pantalla de importación CSV (HU-19) con el reporte de resultados. */
export function ImportarPage() {
  const idArchivo = useId();
  const [archivo, setArchivo] = useState<File | null>(null);
  const [errorArchivo, setErrorArchivo] = useState<string | null>(null);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);
  const [importando, setImportando] = useState(false);
  const [reporte, setReporte] = useState<ReporteImportacion | null>(null);
  const [descargando, setDescargando] = useState(false);
  const [errorPlantilla, setErrorPlantilla] = useState<string | null>(null);
  const reporteRef = useRef<HTMLHeadingElement>(null);

  // Cuando llega el reporte, el foco pasa a su título para que se lea de inmediato.
  useEffect(() => {
    if (reporte) reporteRef.current?.focus();
  }, [reporte]);

  const bajarPlantilla = async () => {
    setDescargando(true);
    setErrorPlantilla(null);
    try {
      const contenido = await descargarPlantilla();
      const url = URL.createObjectURL(contenido);
      const enlace = document.createElement('a');
      enlace.href = url;
      enlace.download = 'plantilla-catalogo.csv';
      enlace.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setErrorPlantilla(`No se pudo descargar la plantilla: ${normalizarError(error).mensaje}`);
    } finally {
      setDescargando(false);
    }
  };

  const enviar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorEnvio(null);
    if (!archivo) {
      setErrorArchivo('Elige el archivo CSV que quieres importar.');
      return;
    }
    if (!/\.csv$/i.test(archivo.name)) {
      setErrorArchivo('El archivo debe tener extensión .csv. En Excel: «Guardar como» → «CSV».');
      return;
    }
    if (archivo.size > TAMANO_MAXIMO) {
      setErrorArchivo('El archivo supera 2 MB. Divídelo en varios archivos más pequeños.');
      return;
    }
    setErrorArchivo(null);
    setImportando(true);
    setReporte(null);
    try {
      setReporte(await importarCatalogo(archivo));
    } catch (error) {
      setErrorEnvio(normalizarError(error).mensaje);
    } finally {
      setImportando(false);
    }
  };

  return (
    <section aria-labelledby="importar-titulo" className={estilosGestion.pagina}>
      <title>Importar catálogo · Panel · Consulta Fácil</title>
      <Link className={estilosGestion.volver} to={RUTAS.panel}>
        <ArrowLeft aria-hidden="true" size={20} />
        Volver al panel
      </Link>
      <header className={estilosGestion.cabecera}>
        <div>
          <h1 id="importar-titulo">Importar catálogo desde CSV</h1>
          <p>Carga muchos libros y ejemplares a la vez, sin registrarlos uno por uno.</p>
        </div>
      </header>

      <div className={styles.instrucciones}>
        <h2>Cómo preparar el archivo</h2>
        <ol>
          <li>Descarga la plantilla y ábrela en Excel o en Hojas de cálculo.</li>
          <li>
            Llena una fila por libro. Son obligatorias las columnas <strong>titulo</strong>,{' '}
            <strong>autores</strong> e <strong>idioma</strong> (por ejemplo «es»).
          </li>
          <li>
            Si un libro tiene varios autores o temas, sepáralos con una barra vertical: <code>Ana Pérez | Luis Gómez</code>.
          </li>
          <li>
            Para registrar un ejemplar, completa <strong>codigo_inventario</strong>, <strong>sala</strong>,{' '}
            <strong>seccion</strong> y <strong>estante</strong>.
          </li>
          <li>Guarda como CSV (separado por comas o por punto y coma). Máximo 1000 filas y 2 MB.</li>
        </ol>
        <p>
          Los autores, temas y ubicaciones que no existan se crean. Un libro que ya está (mismo ISBN, o mismo título y
          autores) no se duplica, así que puedes volver a subir el mismo archivo sin problema.
        </p>
        <Boton disabled={descargando} icono={Download} onClick={() => void bajarPlantilla()} variante="oscuro">
          {descargando ? 'Descargando…' : 'Descargar plantilla'}
        </Boton>
        {errorPlantilla ? (
          <p className={estilosGestion.errorAccion} role="alert">
            {errorPlantilla}
          </p>
        ) : null}
      </div>

      <form aria-labelledby="subir-titulo" className={estilosGestion.formulario} noValidate onSubmit={(e) => void enviar(e)}>
        <h2 id="subir-titulo">Subir archivo</h2>
        <div className={styles.campoArchivo}>
          <label htmlFor={idArchivo}>Archivo CSV</label>
          <input
            accept=".csv,text/csv"
            aria-describedby={errorArchivo ? `${idArchivo}-error` : undefined}
            aria-invalid={errorArchivo ? true : undefined}
            disabled={importando}
            id={idArchivo}
            onChange={(e) => {
              setArchivo(e.target.files?.[0] ?? null);
              setErrorArchivo(null);
            }}
            type="file"
          />
          {errorArchivo ? (
            <p className={styles.error} id={`${idArchivo}-error`} role="alert">
              {errorArchivo}
            </p>
          ) : null}
        </div>
        <div>
          <Boton disabled={importando} icono={FileUp} type="submit">
            {importando ? 'Importando…' : 'Importar'}
          </Boton>
        </div>
        <p aria-live="polite" className={styles.progreso}>
          {importando ? 'Importando el archivo. Con muchas filas puede tardar hasta un minuto; no cierres esta página.' : ''}
        </p>
        {errorEnvio ? (
          <p className={estilosGestion.errorAccion} role="alert">
            <CircleAlert aria-hidden="true" size={18} /> No se pudo importar: {errorEnvio}
          </p>
        ) : null}
      </form>

      {reporte ? <Reporte reporte={reporte} tituloRef={reporteRef} /> : null}
    </section>
  );
}

function Reporte({
  reporte,
  tituloRef,
}: {
  reporte: ReporteImportacion;
  tituloRef: React.RefObject<HTMLHeadingElement | null>;
}) {
  const cifras: [string, number][] = [
    ['Filas en el archivo', reporte.totalFilas],
    ['Filas importadas', reporte.filasImportadas],
    ['Filas con error', reporte.filasConError],
    ['Libros nuevos', reporte.librosCreados],
    ['Libros que ya existían', reporte.librosExistentes],
    ['Ejemplares nuevos', reporte.ejemplaresCreados],
    ['Ejemplares que ya existían', reporte.ejemplaresExistentes],
    ['Autores nuevos', reporte.autoresCreados],
    ['Temas nuevos', reporte.temasCreados],
    ['Ubicaciones nuevas', reporte.ubicacionesCreadas],
  ];
  const todoBien = reporte.filasConError === 0;

  return (
    <section aria-labelledby="reporte-titulo" className={styles.reporte}>
      <h2 id="reporte-titulo" ref={tituloRef} tabIndex={-1}>
        Resultado de la importación
      </h2>
      <p className={todoBien ? styles.exito : styles.parcial}>
        {todoBien
          ? `Se importaron las ${formatoNumero.format(reporte.filasImportadas)} filas sin errores.`
          : `Se importaron ${formatoNumero.format(reporte.filasImportadas)} de ${formatoNumero.format(reporte.totalFilas)} filas. Corrige las filas con error y vuelve a subir el archivo: las que ya se importaron no se duplican.`}
      </p>
      <dl className={styles.cifras}>
        {cifras.map(([nombre, valor]) => (
          <div key={nombre}>
            <dt>{nombre}</dt>
            <dd>{formatoNumero.format(valor)}</dd>
          </div>
        ))}
      </dl>
      {reporte.columnasIgnoradas.length > 0 ? (
        <p className={styles.advertencia}>
          <TriangleAlert aria-hidden="true" size={20} />
          <span>
            Estas columnas no son de la plantilla y no se importaron: <strong>{reporte.columnasIgnoradas.join(', ')}</strong>.
            Revisa que el nombre esté bien escrito.
          </span>
        </p>
      ) : null}
      {reporte.errores.length > 0 ? (
        <div className={estilosGestion.tablaContenedor}>
          <table className={estilosGestion.tabla}>
            <caption>Filas con error (el número es la línea del archivo; la cabecera es la línea 1)</caption>
            <thead>
              <tr>
                <th scope="col">Fila</th>
                <th scope="col">Qué corregir</th>
              </tr>
            </thead>
            <tbody>
              {reporte.errores.map((error) => (
                <tr key={error.fila}>
                  <th scope="row">{error.fila}</th>
                  <td>
                    {error.errores.length === 1 ? (
                      error.errores[0]
                    ) : (
                      <ul className={styles.listaErrores}>
                        {error.errores.map((mensaje) => (
                          <li key={mensaje}>{mensaje}</li>
                        ))}
                      </ul>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
