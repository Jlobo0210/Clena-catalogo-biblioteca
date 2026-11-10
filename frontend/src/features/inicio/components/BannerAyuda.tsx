import { useState } from 'react';
import { BellRing, CircleHelp } from 'lucide-react';
import { sitio } from '../../../config/sitio';
import { Boton } from '../../../shared/ui/Boton';
import styles from './BannerAyuda.module.css';

export function BannerAyuda() {
  const [abierto, setAbierto] = useState(false);

  return (
    <section aria-labelledby="ayuda-titulo" className={styles.banner}>
      <div className={styles.texto}>
        <span className={styles.icono}>
          <CircleHelp aria-hidden="true" size={28} />
        </span>
        <div>
          <h2 id="ayuda-titulo">¿Necesita ayuda para encontrar un documento?</h2>
          <p>Nuestro equipo de referencia bibliográfica le acompaña en cada paso de su consulta.</p>
        </div>
      </div>
      <div className={styles.accion}>
        <Boton
          aria-controls="panel-ayuda"
          aria-expanded={abierto}
          icono={BellRing}
          onClick={() => setAbierto((valor) => !valor)}
          variante="oscuro"
        >
          Solicitar ayuda en sala
        </Boton>
        {abierto ? (
          <p className={styles.panel} id="panel-ayuda">
            Acérquese al {sitio.mostrador} y un bibliotecario le atenderá. También puede llamar al{' '}
            {sitio.telefono}.
          </p>
        ) : null}
      </div>
      {/* TODO: notificar al personal cuando exista el endpoint. */}
    </section>
  );
}
