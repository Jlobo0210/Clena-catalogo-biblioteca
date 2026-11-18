import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { RUTAS } from '../../config/rutas';
import styles from './FormularioParticipacion.module.css';

export function DialogoConfirmacion({ libro, cerrar, devolverFoco }: { libro: boolean; cerrar: () => void; devolverFoco: () => void }) {
  const dialogo = useRef<HTMLDivElement>(null);
  useEffect(() => {
    dialogo.current?.querySelector<HTMLElement>('a')?.focus();
    function teclado(evento: KeyboardEvent) {
      if (evento.key === 'Escape') { evento.preventDefault(); cerrar(); }
      if (evento.key !== 'Tab' || !dialogo.current) return;
      const elementos = Array.from(dialogo.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'));
      if (!elementos.length) return;
      const primero = elementos[0];
      const ultimo = elementos[elementos.length - 1];
      if (evento.shiftKey && (document.activeElement === primero || !dialogo.current.contains(document.activeElement))) { evento.preventDefault(); ultimo.focus(); }
      else if (!evento.shiftKey && (document.activeElement === ultimo || !dialogo.current.contains(document.activeElement))) { evento.preventDefault(); primero.focus(); }
    }
    document.addEventListener('keydown', teclado);
    return () => { document.removeEventListener('keydown', teclado); devolverFoco(); };
  }, [cerrar, devolverFoco]);
  return <div className={styles.fondoDialogo}>
    <div ref={dialogo} className={styles.dialogo} role="dialog" aria-modal="true" aria-labelledby="confirmacion-titulo" aria-describedby="confirmacion-texto">
      <span className={styles.confirmacionIcono} aria-hidden="true">✓</span>
      <h2 id="confirmacion-titulo">{libro ? '¡Sugerencia Registrada!' : '¡Mensaje registrado!'}</h2>
      <p id="confirmacion-texto">{libro ? 'La obra ha sido incorporada al listado de solicitudes para la próxima sesión del comité de adquisiciones bibliográficas.' : 'Su mensaje ha sido registrado para su revisión por la biblioteca.'}</p>
      <Link className={styles.enviar} to={RUTAS.inicio}>Regresar al inicio</Link>
      <button className={styles.cancelar} onClick={cerrar} type="button">Enviar otro</button>
    </div>
  </div>;
}
