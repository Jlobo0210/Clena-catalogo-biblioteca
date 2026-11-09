import { Outlet } from 'react-router-dom';
import { useEstadoServidor } from '../../features/sistema/hooks/useEstadoServidor';
import { Encabezado } from './Encabezado';
import { PiePagina } from './PiePagina';
import { useDesplazamientoPorRuta } from './useDesplazamientoPorRuta';
import { useReinicioTerminal } from './useReinicioTerminal';
import styles from './AppLayout.module.css';

export function AppLayout() {
  const estadoServidor = useEstadoServidor();
  const { claveSesion, reiniciar } = useReinicioTerminal();

  useDesplazamientoPorRuta();

  return (
    <div className={styles.layout}>
      <a className="skip-link" href="#contenido">
        Ir al contenido principal
      </a>
      <Encabezado onReiniciar={reiniciar} />
      <main
        className={styles.contenido}
        id="contenido"
        tabIndex={-1}
      >
        <div className={styles.contenedor}>
          <div key={claveSesion}>
            <Outlet />
          </div>
        </div>
      </main>
      <PiePagina estadoServidor={estadoServidor} onReiniciar={reiniciar} />
    </div>
  );
}
