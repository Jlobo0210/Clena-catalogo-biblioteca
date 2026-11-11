import { useEffect, useState } from 'react';
import { CircleAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import { normalizarError } from '../../api/errores';
import { RUTAS } from '../../config/rutas';
import { sitio } from '../../config/sitio';
import { obtenerMisPrestamos } from './api/prestamos.api';
import { TarjetaPrestamo } from './components/TarjetaPrestamo';
import type { Prestamo } from './types';
import { DIAS_AVISO, formatearInstante, urgenciaDe } from './urgencia';
import styles from './MisPrestamosPage.module.css';

interface Datos {
  pendientes: Prestamo[];
  historial: Prestamo[];
}

/** HU-27: préstamos activos e históricos del usuario, con los vencidos y próximos a vencer resaltados. */
export function MisPrestamosPage() {
  const [datos, setDatos] = useState<Datos | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;
    Promise.all([
      obtenerMisPrestamos({ estado: 'SIN_DEVOLVER', ordenarPor: 'fechaLimite', direccion: 'asc', tamano: 100 }),
      obtenerMisPrestamos({ estado: 'DEVUELTO', ordenarPor: 'fechaPrestamo', direccion: 'desc', tamano: 20 }),
    ])
      .then(([pendientes, historial]) => {
        if (activo) setDatos({ pendientes: pendientes.items, historial: historial.items });
      })
      .catch((e: unknown) => {
        if (activo) setError(normalizarError(e).mensaje);
      });
    return () => {
      activo = false;
    };
  }, []);

  const vencidos = datos?.pendientes.filter((p) => urgenciaDe(p) === 'vencido').length ?? 0;
  const proximos = datos?.pendientes.filter((p) => urgenciaDe(p) === 'proximo').length ?? 0;

  return (
    <section aria-labelledby="mis-prestamos-titulo" className={styles.pagina}>
      <h1 id="mis-prestamos-titulo">Mis préstamos</h1>

      {error ? <p role="alert">{error}</p> : null}
      {!datos && !error ? <p role="status">Cargando tus préstamos…</p> : null}

      {datos ? (
        <>
          {vencidos > 0 || proximos > 0 ? (
            <div className={vencidos > 0 ? styles.avisoUrgente : styles.aviso} role="status">
              <CircleAlert aria-hidden="true" size={24} />
              <p>
                {vencidos > 0
                  ? `Tienes ${vencidos} ${vencidos === 1 ? 'préstamo vencido' : 'préstamos vencidos'}. `
                  : ''}
                {proximos > 0
                  ? `${proximos} ${proximos === 1 ? 'vence' : 'vencen'} en ${DIAS_AVISO} días o menos. `
                  : ''}
                Devuélvelos en el {sitio.mostrador}.
              </p>
            </div>
          ) : null}

          <section aria-labelledby="pendientes-titulo" className={styles.seccion}>
            <h2 id="pendientes-titulo">Por devolver ({datos.pendientes.length})</h2>
            {datos.pendientes.length === 0 ? (
              <p className={styles.vacio}>
                No tienes libros prestados. <Link to={RUTAS.buscar}>Busca un libro en el catálogo</Link>.
              </p>
            ) : (
              <ul className={styles.lista}>
                {datos.pendientes.map((p) => (
                  <li key={p.id}>
                    <TarjetaPrestamo prestamo={p} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="historial-titulo" className={styles.seccion}>
            <h2 id="historial-titulo">Historial</h2>
            {datos.historial.length === 0 ? (
              <p className={styles.vacio}>Aún no has devuelto ningún préstamo.</p>
            ) : (
              <div className={styles.tablaContenedor}>
                <table className={styles.tabla}>
                  <caption className="visualmente-oculto">Préstamos devueltos, del más reciente al más antiguo</caption>
                  <thead>
                    <tr>
                      <th scope="col">Libro</th>
                      <th scope="col">Prestado el</th>
                      <th scope="col">Devuelto el</th>
                    </tr>
                  </thead>
                  <tbody>
                    {datos.historial.map((p) => (
                      <tr key={p.id}>
                        <th scope="row">{p.libro.titulo}</th>
                        <td>{formatearInstante(p.fechaPrestamo)}</td>
                        <td>{p.fechaDevolucion ? formatearInstante(p.fechaDevolucion) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      ) : null}
    </section>
  );
}
