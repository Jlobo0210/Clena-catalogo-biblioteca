import styles from './EncabezadoSeccion.module.css';

interface EncabezadoSeccionProps {
  antetitulo: string;
  id?: string;
  titulo: string;
  textoLateral?: string;
}

export function EncabezadoSeccion({
  antetitulo,
  id,
  textoLateral,
  titulo,
}: EncabezadoSeccionProps) {
  return (
    <div className={styles.encabezado}>
      <div>
        <p className={styles.antetitulo}>{antetitulo}</p>
        <h2 id={id}>{titulo}</h2>
      </div>
      {textoLateral ? <p className={styles.lateral}>{textoLateral}</p> : null}
    </div>
  );
}
