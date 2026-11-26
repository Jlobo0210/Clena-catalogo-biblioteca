import { ContactoBiblioteca } from './ContactoBiblioteca';
import styles from './Ayuda.module.css';
import { Link } from 'react-router-dom';
import { RUTAS } from '../../config/rutas';

function Icono({ nombre, relleno = false }: { nombre: string; relleno?: boolean }) {
  return <span aria-hidden="true" className={`material-symbols-outlined ${relleno ? styles.relleno : ''}`}>{nombre}</span>;
}

export function AyudaPage() {
  return (
    <div className={styles.pagina}>
      <title>Ayuda · Consulta Fácil</title>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap" />
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" />
      {/* TODO(HU-37): confirmar con la biblioteca los datos de terminal y asistencia. */}
      <section className={styles.banner}>
        <div className={styles.bannerTexto}>
          <div className={styles.bannerEtiqueta}><span className={styles.iconoCircular}><Icono nombre="help_center" relleno /></span><span>Centro de Asistencia al Usuario</span></div>
          <h1>¿En qué podemos orientarle hoy?</h1>
          <p>Usted cuenta con acompañamiento presencial y canales directos de participación en la Biblioteca Piloto del Caribe.</p>
        </div>
        <div className={styles.terminal}><span className={styles.terminalIcono}><Icono nombre="desktop_windows" /></span><div><span>Puesto de consulta:</span><strong>Terminal 04 • Sala General</strong></div></div>
      </section>
      <div className={styles.grid}>
        <section className={styles.asistencia}>
          <div className={styles.asistenciaInterior}>
            <div className={styles.asistenciaTexto}>
              <div className={styles.chip}><Icono nombre="support_agent" relleno /> Atención Presencial Inmediata</div>
              <h2>Pedir ayuda a un bibliotecario</h2>
              <p>Si tiene dificultad para hallar un texto, requiere orientación bibliográfica o el equipo presenta una novedad, pulse el botón. Un funcionario se acercará de inmediato a su mesa.</p>
              <div className={styles.miniTarjetas}>
                <div><Icono nombre="storefront" /><div><strong>Mostrador Central Activo</strong><span>A 15 metros de su pantalla</span></div></div>
                <div><Icono nombre="schedule" /><div><strong>Tiempo estimado</strong><span>Menos de 2 minutos</span></div></div>
              </div>
            </div>
            <div className={styles.accion}>
              {/* TODO(HU-37): la funcionalidad de asistencia corresponde a otro issue. */}
              <button type="button" disabled><Icono nombre="notifications_active" relleno /> Solicitar asistencia ahora</button>
              <span>Se emitirá una señal luminosa en el módulo central</span>
            </div>
          </div>
        </section>
        <section className={styles.contacto}>
          <h2>Contacto directo</h2>
          <ContactoBiblioteca compacta />
        </section>
        <article className={styles.tarjeta}>
          <div className={styles.tarjetaContenido}>
            <div className={styles.tarjetaCabecera}><span className={styles.iconoTarjeta}><Icono nombre="auto_stories" /></span><span>Desarrollo de Colecciones</span></div>
            <h3>Sugerir un libro para comprar</h3>
            <p>¿Buscó un título, autor o tema en nuestro catálogo y no se encuentra disponible? Usted puede formular una solicitud de compra para enriquecer el acervo de la biblioteca.</p>
            <div className={styles.informacion}><Icono nombre="fact_check" /><span>El comité bibliográfico evalúa adquisiciones semanalmente.</span></div>
          </div>
          <Link className={styles.secundario} to={`${RUTAS.formularioAyuda}?motivo=libro`}><Icono nombre="edit_note" /> Hacer una sugerencia</Link>
        </article>
        <article className={styles.tarjeta}>
          <div className={styles.tarjetaContenido}>
            <div className={styles.tarjetaCabecera}><span className={styles.iconoTarjeta}><Icono nombre="rate_review" /></span><span>Atención Ciudadana</span></div>
            <h3>Buzón de quejas y sugerencias</h3>
            <p>Su experiencia es fundamental para nosotros. Exprese sus opiniones y observaciones sobre las salas, el aire acondicionado, los equipos o la atención prestada.</p>
            <div className={styles.informacion}><Icono nombre="mark_email_read" /><span>Respuesta oficial y seguimiento por parte de la dirección.</span></div>
          </div>
          <Link className={styles.secundario} to={`${RUTAS.formularioAyuda}?motivo=buzon`}><Icono nombre="outgoing_mail" /> Escribir al buzón</Link>
        </article>
      </div>
      <section className={styles.complemento} aria-label="Información complementaria">
        <div><img src="/hu-37/ayuda-1.jpg" alt="" /><p><strong>Personal Calificado</strong><span>Bibliotecólogos dispuestos a guiar su búsqueda paso a paso.</span></p></div>
        <div><img src="/hu-37/ayuda-2.jpg" alt="" /><p><strong>Patrimonio del Caribe</strong><span>Custodiamos la memoria documental e histórica del Atlántico.</span></p></div>
        <div><img src="/hu-37/ayuda-3.jpg" alt="" /><p><strong>Acceso Abierto</strong><span>Salas climatizadas con conexión gratuita y consulta libre.</span></p></div>
      </section>
    </div>
  );
}
