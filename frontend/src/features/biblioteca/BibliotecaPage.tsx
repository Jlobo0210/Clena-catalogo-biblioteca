import { Link } from 'react-router-dom';
import { RUTAS } from '../../config/rutas';
import { useConfiguracion } from './useConfiguracion';
import styles from './BibliotecaReferencia.module.css';

function Icono({ nombre, lleno = false }: { nombre: string; lleno?: boolean }) {
  return <span aria-hidden="true" className={`${styles.icono} ${lleno ? styles.lleno : ''}`}>{nombre}</span>;
}

const servicios = [
  { numero: '02', icono: 'history_edu', nombre: 'Archivo Histórico del Atlántico', descripcion: 'Custodia y consulta guiada de legajos notariales, cartas fundacionales, actas y memorias oficiales desde el siglo XVIII con protocolos de conservación preventiva.', chips: ['Ala Norte • Nivel 2', 'Asistencia guiada'], iconos: ['pin_drop', 'verified'] },
  { numero: '03', icono: 'newspaper', nombre: 'Hemeroteca de Prensa Centenaria', descripcion: 'Registros periódicos de la Costa Norte colombiana desde el siglo XIX a la fecha: microfilmes de El Heraldo, El Progreso, gacetas oficiales y publicaciones locales.', chips: ['Hemeroteca Central', 'Físicos & Microfilm'], iconos: ['pin_drop', 'folder_zip'] },
  { numero: '05', icono: 'psychology_alt', nombre: 'Animación y Talleres Culturales', descripcion: 'Tertulias literarias sobre autores caribeños, clubes de lectura infantil, talleres de memoria para el adulto mayor y jornadas de escritura creativa los fines de semana.', chips: ['Adulto Mayor y Jóvenes', 'Entrada sin costo'], iconos: ['groups', 'celebration'] },
];

export function BibliotecaPage() {
  const estado = useConfiguracion();
  const lineas = estado.tipo === 'listo' ? estado.datos.horarios.split(/\r?\n/).filter(Boolean) : [];
  return (
    <div className={styles.pagina}>
      <title>La Biblioteca - Información y Servicios | Biblioteca Piloto del Caribe</title>
      {/* TODO(HU-37): confirmar con la biblioteca los datos institucionales y de servicios. */}
      <section className={styles.hero}>
        <div className={styles.brillo} aria-hidden="true" />
        <div className={styles.edificio}><Icono nombre="account_balance" /></div>
        <div className={styles.heroContenido}>
          <div className={styles.etiqueta}><Icono nombre="hotel_class" lleno /> Sede Histórica • Complejo Cultural de la Aduana, Barranquilla</div>
          <h1>La Biblioteca Piloto del Caribe</h1>
          <p>Conozca los espacios, servicios y patrimonio cultural al servicio de la comunidad. Custodiamos la memoria documental del Caribe colombiano con atención pública, cálida y de libre acceso para todos los ciudadanos.</p>
          <div className={styles.datosHero}><span><Icono nombre="pin_drop" />Vía 40 # 36-135, Barranquilla</span><span><Icono nombre="verified" />Acceso público e irrestricto</span><span><Icono nombre="menu_book" />Más de 120.000 títulos patrimoniales</span></div>
        </div>
      </section>
      <section className={styles.horarios}>
        <div className={styles.encabezadoHorarios}><div className={styles.encabezadoTitulo}><div className={styles.cajaReloj}><Icono nombre="schedule" lleno /></div><div><h2>Horarios de Atención y Disponibilidad</h2><p>Atención continua de puertas abiertas para toda la comunidad barranquillera y visitantes.</p></div></div>{/* TODO(HU-37): confirmar con la biblioteca el estado de apertura. */}<span className={styles.abierto}>● &nbsp; Abierto hoy</span></div>
        <div className={styles.cuatroColumnas}>
          {estado.tipo === 'listo' ? <div className={`${styles.ficha} ${styles.fichaHorarios}`}>{lineas.map((linea, i) => {
            const separador = linea.indexOf(':');
            const titulo = separador < 0 ? 'Horario' : linea.slice(0, separador);
            const horario = separador < 0 ? linea : linea.slice(separador + 1).trim();
            return <div className={styles.bloqueHorario} key={`${i}-${linea}`}><div className={styles.fichaTitulo}><Icono nombre={i === 0 ? 'calendar_month' : 'wb_sunny'} /><div><strong>{titulo}</strong></div></div><strong className={styles.hora}>{horario}</strong></div>;
          })}</div> : <div className={styles.ficha} role={estado.tipo === 'error' ? 'alert' : 'status'}>{estado.tipo === 'cargando' ? 'Cargando horarios…' : estado.tipo === 'error' ? 'No fue posible cargar los horarios.' : 'La biblioteca aún no ha publicado horarios.'}</div>}
          <div className={styles.ficha}><div className={styles.sede}><strong>Sede Aduana</strong><span>● En servicio</span></div><p>Espacios habilitados en sala:</p><div className={styles.salas}><span>Sala General</span><span>Archivo Histórico</span><span>Hemeroteca</span><span>Sala Infantil</span></div></div>
          <div className={`${styles.ficha} ${styles.asistencia}`}><div><strong><Icono nombre="support_agent" /> Asistencia en sala</strong><p>Personal bibliotecólogo disponible para orientarlo de inmediato en su mesa.</p></div>{/* TODO HU-37: solicitud de asistencia fuera de alcance. */}<button type="button" disabled><Icono nombre="notifications_active" /> Llamar bibliotecario</button></div>
        </div>
        {estado.tipo === 'listo' && <div className={styles.contacto}><a href={`tel:${estado.datos.telefono.replace(/[^\d+]/g, '')}`}><Icono nombre="call" />{estado.datos.telefono}</a><a href={`mailto:${estado.datos.correo}`}><Icono nombre="mail" />{estado.datos.correo}</a></div>}
      </section>
      <section className={styles.servicios}><div className={styles.serviciosCabecera}><div><span className={styles.chipServicios}><Icono nombre="auto_stories" /> Catálogo Integral de Servicios</span><h2>Servicios Bibliotecarios al Ciudadano</h2><p>Diseñados para una lectura cómoda, investigación rigurosa y acompañamiento paso a paso.</p></div><span className={styles.cantidad}>3 servicios principales</span></div>
        <div className={styles.tarjetas}>{servicios.map((servicio, i) => <article className={styles.tarjeta} key={servicio.numero}><div><div className={styles.tarjetaCabecera}><div className={`${styles.cajaServicio} ${styles[`color${i}`]}`}><Icono nombre={servicio.icono} lleno /></div><span>Servicio {servicio.numero}</span></div><h3>{servicio.nombre}</h3><p>{servicio.descripcion}</p><div className={styles.chips}>{servicio.chips.map((chip, indice) => <span key={chip}><Icono nombre={servicio.iconos[indice]} />{chip}</span>)}</div></div>{/* TODO HU-37: detalle de servicio fuera de alcance. */}<button type="button" disabled><span><Icono nombre="touch_app" /> Presione aquí para ver detalles</span><Icono nombre="arrow_forward" /></button></article>)}</div>
      </section>
      <section className={styles.barra}><div className={styles.barraInfo}><div className={styles.cajaAyuda}><Icono nombre="help_center" lleno /></div><div><h2>¿Requiere acompañamiento personal en esta terminal?</h2><p>Si tiene dificultades para leer en pantalla, navegar por el catálogo o hallar un ejemplar en los depósitos, solicite asistencia inmediata en su mesa.</p></div></div><div className={styles.acciones}><Link to={RUTAS.inicio}><Icono nombre="arrow_back" /> Volver a Inicio</Link>{/* TODO HU-37: solicitud de asistencia fuera de alcance. */}<button type="button" disabled><Icono nombre="notifications_active" /> Llamar al bibliotecario</button></div></section>
    </div>
  );
}
