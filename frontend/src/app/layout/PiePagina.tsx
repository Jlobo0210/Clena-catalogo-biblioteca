import { RotateCcw } from 'lucide-react';
import { Boton } from '../../shared/ui/Boton';
import { MarcaBiblioteca } from '../../shared/ui/MarcaBiblioteca';
import { sitio } from '../../config/sitio';
import { terminal } from '../../config/terminal';
import type { EstadoServidor } from '../../features/sistema/hooks/useEstadoServidor';
import { EstadoServidor as EstadoServidorView } from '../../features/sistema/components/EstadoServidor';
import styles from './PiePagina.module.css';

interface PiePaginaProps {
  estadoServidor: EstadoServidor;
  onReiniciar: () => void;
}

export function PiePagina({ estadoServidor, onReiniciar }: PiePaginaProps) {
  const ano = new Date().getFullYear();

  return (
    <footer className={styles.pie}>
      <div className={styles.columnas}>
        <div className={styles.identidad}>
          <MarcaBiblioteca />
          <strong>Biblioteca Piloto del Caribe</strong>
          <span className={styles.direccion}>{sitio.direccion}</span>
          <p>
            Patrimonio cultural, archivo histórico y fomento a la lectura pública en el departamento
            del Atlántico y el Gran Caribe colombiano.
          </p>
        </div>
        <div>
          <h2>Servicios en sala</h2>
          <ul>
            {sitio.serviciosEnSala.map((servicio) => (
              <li key={servicio}>{servicio}</li>
            ))}
          </ul>
        </div>
        <div>
          <h2>Accesibilidad y ayuda</h2>
          <ul>
            {sitio.ayudas.map((ayuda) => (
              <li key={ayuda}>{ayuda}</li>
            ))}
          </ul>
        </div>
        <div className={styles.estadoTarjeta}>
          <p>
            Terminal actual: <strong>{terminal.codigo}</strong>
          </p>
          <p>
            Conexión a servidor: <EstadoServidorView estado={estadoServidor} />
          </p>
          <Boton icono={RotateCcw} onClick={onReiniciar} variante="translucido">
            Restablecer pantalla inicial
          </Boton>
        </div>
      </div>
      <div className={styles.inferior}>
        <span>
          © {ano} Biblioteca Piloto del Caribe <span aria-hidden="true">·</span> Corporación Luis
          Eduardo Nieto Arteta
        </span>
        <span>
          Barranquilla, Colombia <span aria-hidden="true">·</span> Uso libre y gratuito
        </span>
      </div>
    </footer>
  );
}
