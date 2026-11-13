import { useEffect, useState } from 'react';
import { Download, Printer, QrCode } from 'lucide-react';
import QRCode from 'qrcode';
import { Boton } from '../../shared/ui/Boton';
import { urlAccesoQr } from './urlAccesoQr';
import styles from './QrAccesoPage.module.css';

type EstadoQr =
  | { estado: 'cargando' }
  | { estado: 'listo'; imagen: string }
  | { estado: 'error' };

/**
 * HU-31: el personal descarga o imprime el QR que abre la búsqueda en el celular.
 * El QR se genera en el navegador; no depende del backend.
 */
export function QrAccesoPage() {
  const url = urlAccesoQr();
  const [qr, setQr] = useState<EstadoQr>({ estado: 'cargando' });

  useEffect(() => {
    let vigente = true;
    QRCode.toDataURL(url, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 600,
      color: { dark: '#0e0d39', light: '#ffffff' },
    })
      .then((imagen) => {
        if (vigente) setQr({ estado: 'listo', imagen });
      })
      .catch(() => {
        if (vigente) setQr({ estado: 'error' });
      });
    return () => {
      vigente = false;
    };
  }, [url]);

  return (
    <section aria-labelledby="qr-titulo" className={styles.pagina}>
      <title>Código QR de acceso · Consulta Fácil</title>
      <h1 id="qr-titulo">Código QR de acceso</h1>
      <p className={styles.intro}>
        Imprima este código y péguelo en las mesas, la entrada y los estantes. Al escanearlo con
        la cámara del celular se abre la búsqueda del catálogo, sin instalar nada.
      </p>

      <div className={styles.cartel}>
        <p className={styles.cartelTitulo}>Busque libros desde su celular</p>
        {qr.estado === 'listo' ? (
          <img
            alt={`Código QR que abre la búsqueda del catálogo en ${url}`}
            className={styles.qr}
            height={300}
            src={qr.imagen}
            width={300}
          />
        ) : qr.estado === 'error' ? (
          <p className={styles.error} role="alert">
            No se pudo generar el código QR. Recargue la página e intente de nuevo.
          </p>
        ) : (
          <p className={styles.cargando} role="status">
            <QrCode aria-hidden="true" size={24} /> Generando el código…
          </p>
        )}
        <p className={styles.cartelTexto}>
          Escanee con la cámara y escriba el título, el autor o el tema.
        </p>
        <p className={styles.url}>{url}</p>
      </div>

      <div className={styles.acciones}>
        {qr.estado === 'listo' ? (
          <a className={styles.descargar} download="qr-consulta-facil.png" href={qr.imagen}>
            <Download aria-hidden="true" size={20} />
            Descargar imagen (PNG)
          </a>
        ) : null}
        <Boton icono={Printer} onClick={() => window.print()} variante="oscuro">
          Imprimir cartel
        </Boton>
      </div>
    </section>
  );
}
