import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EncabezadoSeccion } from '../../../shared/ui/EncabezadoSeccion';
import { IconoCaja } from '../../../shared/ui/IconoCaja';
import { accesosDirectos } from '../contenido';
import styles from './AccesosDirectos.module.css';

export function AccesosDirectos() {
  return (
    <section aria-labelledby="accesos-titulo">
      <EncabezadoSeccion
        antetitulo="Acceso directo"
        id="accesos-titulo"
        textoLateral="Seleccione para explorar"
        titulo="Áreas de consulta principal"
      />
      <ul className={styles.lista}>
        {accesosDirectos.map((acceso) => (
          <li key={acceso.titulo}>
            <Link className={styles.tarjeta} to={acceso.destino}>
              <IconoCaja
                className={`${styles.icono} ${styles[acceso.variante]}`}
                icono={acceso.icono}
              />
              <h3>{acceso.titulo}</h3>
              <p>{acceso.descripcion}</p>
              <strong>
                {acceso.accion}
                <ArrowRight aria-hidden="true" size={18} />
              </strong>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
