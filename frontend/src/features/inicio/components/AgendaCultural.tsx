import { ArrowLeft, ArrowRight, CalendarDays } from 'lucide-react';
import { agendaCultural } from '../contenido';
import styles from './AgendaCultural.module.css';

export function AgendaCultural() {
  return (
    <section aria-labelledby="agenda-titulo" className={styles.seccion}>
      <div className={styles.encabezado}>
        <div>
          <p className={styles.antetitulo}>
            <CalendarDays aria-hidden="true" size={16} />
            Agenda y actualidad cultural
          </p>
          <h2 id="agenda-titulo">Noticias y Eventos de la Biblioteca</h2>
        </div>
        <div className={styles.controles}>
          <a href="#agenda-titulo">Ver toda la agenda <ArrowRight aria-hidden="true" size={18} /></a>
          <button aria-label="Evento anterior" disabled type="button"><ArrowLeft aria-hidden="true" size={16} /></button>
          <button aria-label="Evento siguiente" disabled type="button"><ArrowRight aria-hidden="true" size={16} /></button>
        </div>
      </div>
      <ul className={styles.lista}>
        {agendaCultural.map((evento) => (
          <li key={evento.id}>
            <article className={styles.tarjeta} id={evento.id}>
              <div className={styles.meta}>
                <span className={styles[evento.variante]}>{evento.etiqueta}</span>
                <time>{evento.fecha}</time>
              </div>
              <h3>{evento.titulo}</h3>
              <p>{evento.descripcion}</p>
              <a href={`#${evento.id}`}>
                {evento.accion}
                <ArrowRight aria-hidden="true" size={18} />
              </a>
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}
