import { useTotalLibros } from '../catalogo/hooks/useTotalLibros';
import { AccesosDirectos } from './components/AccesosDirectos';
import { BannerAyuda } from './components/BannerAyuda';
import { PortadaBusqueda } from './components/PortadaBusqueda';
import { ServiciosSala } from './components/ServiciosSala';
import styles from './InicioPage.module.css';

export function InicioPage() {
  const { total } = useTotalLibros();

  return (
    <>
      <title>Inicio · Consulta Fácil</title>
      <div className={styles.inicio}>
        <PortadaBusqueda totalLibros={total} />
        <AccesosDirectos />
        <ServiciosSala />
        <BannerAyuda />
      </div>
    </>
  );
}
