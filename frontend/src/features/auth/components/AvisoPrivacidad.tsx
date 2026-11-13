import type { AvisoPrivacidad as Aviso } from '../types';
import styles from './Formulario.module.css';

export function AvisoPrivacidad({ aviso }: { aviso: Aviso }) {
  return (
    <section aria-labelledby="aviso-titulo" className={styles.aviso}>
      <h2 id="aviso-titulo">Aviso de privacidad (versión {aviso.version})</h2>
      <p>{aviso.texto}</p>
      <p>
        <strong>Responsable:</strong> {aviso.responsable}
      </p>
      <p>
        <strong>Datos que guardamos:</strong> {aviso.datosRecolectados.join(', ')}.
      </p>
      <p>
        <strong>Para qué los usamos:</strong>
      </p>
      <ul>
        {aviso.finalidades.map((f) => (
          <li key={f}>{f}</li>
        ))}
      </ul>
      <p>
        <strong>Tus derechos:</strong> {aviso.derechos}
      </p>
    </section>
  );
}
