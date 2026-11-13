import { CircleAlert, CircleCheck, Clock } from 'lucide-react';
import type { Prestamo } from '../types';
import { formatearDia, textoPlazo, urgenciaDe } from '../urgencia';
import styles from './TarjetaPrestamo.module.css';

const ICONO = { vencido: CircleAlert, proximo: Clock, 'al-dia': CircleCheck, devuelto: CircleCheck };

export function TarjetaPrestamo({ prestamo }: { prestamo: Prestamo }) {
  const urgencia = urgenciaDe(prestamo);
  const Icono = ICONO[urgencia];
  const idTitulo = `prestamo-${prestamo.id}`;

  return (
    <article aria-labelledby={idTitulo} className={`${styles.tarjeta} ${styles[urgencia]}`}>
      <h3 className={styles.titulo} id={idTitulo}>
        {prestamo.libro.titulo}
      </h3>
      <p className={styles.etiqueta}>
        <Icono aria-hidden="true" size={22} />
        <strong>{textoPlazo(prestamo)}</strong>
      </p>
      <dl className={styles.datos}>
        <div>
          <dt>Devolver hasta</dt>
          <dd>{formatearDia(prestamo.fechaLimite)}</dd>
        </div>
        <div>
          <dt>Código del ejemplar</dt>
          <dd>{prestamo.ejemplar.codigoInventario}</dd>
        </div>
      </dl>
    </article>
  );
}
