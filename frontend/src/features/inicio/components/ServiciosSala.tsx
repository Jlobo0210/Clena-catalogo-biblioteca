import { Clock, Headset, Library, MapPin, Monitor, Wifi } from 'lucide-react';
import { sitio } from '../../../config/sitio';
import { EncabezadoSeccion } from '../../../shared/ui/EncabezadoSeccion';
import { IconoCaja } from '../../../shared/ui/IconoCaja';
import styles from './ServiciosSala.module.css';

export function ServiciosSala() {
  return (
    <section
      aria-labelledby="servicios-titulo"
      id="contacto"
      tabIndex={-1}
    >
      <EncabezadoSeccion
        antetitulo="Atención en sede La Aduana"
        id="servicios-titulo"
        titulo="Servicios presenciales y asistencia"
      />
      <div className={styles.lista}>
        <article className={styles.tarjeta}>
          <IconoCaja className={`${styles.icono} ${styles.ambar}`} icono={Headset} />
          <h3>Orientación en sala</h3>
          <p>
            Nuestros bibliotecarios le orientan directamente en el Mostrador Principal (Piso 1).
            Si requiere asistencia visual o para adultos mayores, solicítela libremente.
          </p>
          <div className={styles.dato}>
            <MapPin aria-hidden="true" size={20} />
            <strong>{sitio.mostrador}</strong>
          </div>
        </article>
        <article className={styles.tarjeta}>
          <IconoCaja className={`${styles.icono} ${styles.azul}`} icono={Library} />
          <h3>Préstamo y consulta en mesas</h3>
          <p>
            Anote el código topográfico (cota) y preséntelo con su documento de identidad. Puede
            consultar hasta {sitio.maxLibrosEnMesa} libros en simultáneo en las mesas de estudio.
          </p>
          <div className={styles.dato}>
            <Clock aria-hidden="true" size={20} />
            <strong>{sitio.horario}</strong>
          </div>
        </article>
        <article className={styles.tarjeta}>
          <IconoCaja className={`${styles.icono} ${styles.clara}`} icono={Monitor} />
          <h3>Terminales y digitalización</h3>
          <p>
            Uso libre y gratuito de computadores para investigación, catálogo web, conexión Wi-Fi
            abierta y acompañamiento para escanear fragmentos de prensa histórica.
          </p>
          <div className={styles.dato}>
            <Wifi aria-hidden="true" size={20} />
            <strong>Red: {sitio.redWifi}</strong>
          </div>
        </article>
      </div>
    </section>
  );
}
