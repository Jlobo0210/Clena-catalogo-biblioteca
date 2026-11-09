import { AlertCircle } from 'lucide-react';
import type { EstadoServidor as EstadoServidorId } from '../hooks/useEstadoServidor';
import styles from './EstadoServidor.module.css';

interface EstadoServidorProps {
  estado: EstadoServidorId;
}

export function EstadoServidor({ estado }: EstadoServidorProps) {
  const etiqueta =
    estado === 'comprobando'
      ? 'Comprobando…'
      : estado === 'en-linea'
        ? 'En línea'
        : 'Sin conexión';

  return (
    <span aria-live="polite" className={`${styles.estado} ${styles[estado]}`}>
      <span aria-hidden="true" className={styles.punto} />
      {estado === 'sin-conexion' ? <AlertCircle aria-hidden="true" size={16} /> : null}
      {etiqueta}
    </span>
  );
}
