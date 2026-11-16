import { useCallback, useRef, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiClient } from '../../api/apiClient';
import { RUTAS } from '../../config/rutas';
import { DialogoConfirmacion } from './DialogoConfirmacion';
import styles from './FormularioParticipacion.module.css';

type Campo = 'titulo' | 'autor' | 'mensaje' | 'nombre' | 'correo';
type Valores = Record<Campo, string>;
type Errores = Partial<Record<Campo, string>>;
type TipoBuzon = 'SUGERENCIA' | 'FELICITACION' | 'QUEJA';
const vacio: Valores = { titulo: '', autor: '', mensaje: '', nombre: '', correo: '' };

function Icono({ nombre }: { nombre: string }) {
  return <span className="material-symbols-outlined" aria-hidden="true">{nombre}</span>;
}

export function FormularioParticipacionPage() {
  const [params, setParams] = useSearchParams();
  const libro = params.get('motivo') !== 'buzon';
  const [tipo, setTipo] = useState<TipoBuzon>('SUGERENCIA');
  const [valores, setValores] = useState<Valores>(vacio);
  const [errores, setErrores] = useState<Errores>({});
  const [enviando, setEnviando] = useState(false);
  const [fallo, setFallo] = useState('');
  const [confirmado, setConfirmado] = useState(false);
  const enviarRef = useRef<HTMLButtonElement>(null);
  const cerrar = useCallback(() => { setConfirmado(false); setValores(vacio); setErrores({}); }, []);
  const devolverFoco = useCallback(() => enviarRef.current?.focus(), []);

  function cambiarMotivo(motivo: 'libro' | 'buzon') {
    setParams({ motivo }, { replace: true });
    setErrores({});
    setFallo('');
  }
  function actualizar(campo: Campo, valor: string) {
    setValores(actual => ({ ...actual, [campo]: valor }));
    setErrores(actual => ({ ...actual, [campo]: undefined }));
  }
  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const nuevos: Errores = {};
    if (libro && !valores.titulo.trim()) nuevos.titulo = 'Escriba el título de la obra.';
    if (libro && !valores.autor.trim()) nuevos.autor = 'Escriba el autor de la obra.';
    if (!libro && !valores.mensaje.trim()) nuevos.mensaje = 'Escriba su mensaje.';
    if (valores.correo.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valores.correo.trim())) nuevos.correo = 'Escriba un correo válido.';
    setErrores(nuevos);
    if (Object.keys(nuevos).length) {
      document.getElementById(Object.keys(nuevos)[0])?.focus();
      return;
    }
    setEnviando(true);
    setFallo('');
    const opcional = (valor: string) => valor.trim() || undefined;
    try {
      await apiClient.post('/solicitudes-participacion', {
        tipo: libro ? 'LIBRO' : tipo,
        titulo: libro ? opcional(valores.titulo) : undefined,
        autor: libro ? opcional(valores.autor) : undefined,
        mensaje: opcional(valores.mensaje),
        nombre: libro ? undefined : opcional(valores.nombre),
        correo: opcional(valores.correo),
      });
      setConfirmado(true);
    } catch {
      setFallo('No fue posible enviar su mensaje. Verifique la conexión e intente nuevamente.');
    } finally { setEnviando(false); }
  }
  function campo(id: Campo, etiqueta: string, requerido: boolean, placeholder: string, maxLength: number, multilinea = false, ayuda?: string) {
    const descripcion = [ayuda ? `${id}-ayuda` : '', errores[id] ? `${id}-error` : '', id === 'correo' && valores.correo.trim() ? 'privacidad' : ''].filter(Boolean).join(' ') || undefined;
    const propiedades = { id, name: id, value: valores[id], placeholder, maxLength, required: requerido, 'aria-invalid': !!errores[id], 'aria-describedby': descripcion, onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => actualizar(id, e.target.value) };
    return <div className={styles.campo}>
      <div className={styles.etiqueta}><label htmlFor={id}>{etiqueta}{requerido && <span aria-hidden="true"> *</span>}</label><span className={requerido ? styles.requerido : styles.opcional}>{requerido ? 'Requerido' : 'Opcional'}</span></div>
      {ayuda && <p id={`${id}-ayuda`}>{ayuda}</p>}
      {multilinea ? <textarea {...propiedades} rows={3} /> : <input {...propiedades} type={id === 'correo' ? 'email' : 'text'} />}
      {errores[id] && <p className={styles.error} id={`${id}-error`}>{errores[id]}</p>}
      {id === 'correo' && valores.correo.trim() && <p id="privacidad">Su correo se usará para gestionar esta solicitud. Consulte el aviso de privacidad de la biblioteca.</p>}
    </div>;
  }
  return <div className={styles.pagina}>
    <title>Participación ciudadana · Consulta Fácil</title>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap" />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" />
    <div className={styles.superior}><Link className={styles.volver} to={RUTAS.ayuda}><Icono nombre="arrow_back" /> Volver a Ayuda</Link><span className={styles.chip}><Icono nombre="auto_stories" /> {libro ? 'Servicio de Adquisición Sugerida' : 'Atención Ciudadana'}</span></div>
    <div className={styles.panel}>
      <fieldset className={styles.selector}><legend>Seleccione el motivo</legend><div>
        <label><input type="radio" name="motivo" checked={libro} onChange={() => cambiarMotivo('libro')} /><span>Sugerir un libro</span></label>
        <label><input type="radio" name="motivo" checked={!libro} onChange={() => cambiarMotivo('buzon')} /><span>Buzón</span></label>
      </div></fieldset>
      {!libro && <fieldset className={styles.selector}><legend>Tipo de mensaje</legend><div>{(['SUGERENCIA', 'FELICITACION', 'QUEJA'] as const).map(opcion => <label key={opcion}><input type="radio" name="tipo" checked={tipo === opcion} onChange={() => setTipo(opcion)} /><span>{opcion === 'SUGERENCIA' ? 'Sugerencia' : opcion === 'FELICITACION' ? 'Felicitación' : 'Queja'}</span></label>)}</div></fieldset>}
      {/* TODO(HU-XX): confirmar con la biblioteca los textos del buzón. */}
      <div className={styles.intro}><div className={styles.introEtiqueta}><Icono nombre="markunread_mailbox" /> {libro ? 'Participación Ciudadana y Desarrollo de Colecciones' : 'Participación Ciudadana y Atención al Usuario'}</div>
        <h1>{libro ? 'Sugerir un libro para compra' : 'Buzón de participación ciudadana'}</h1>
        <p>{libro ? 'Si no encontró la obra que buscaba en nuestro catálogo, indique los datos para evaluar su adquisición.' : 'Comparta su mensaje para contribuir al mejoramiento de los servicios de la biblioteca.'}</p>
      </div>
      {libro && <div className={styles.aviso}><span className={styles.avisoIcono}><Icono nombre="verified" /></span><div><strong>Proceso de Selección Bibliográfica</strong><p>Las sugerencias son analizadas periódicamente por el comité de adquisiciones de la Biblioteca Piloto del Caribe para enriquecer los fondos de libre acceso y preservación patrimonial.</p></div></div>}
      <form className={styles.formulario} onSubmit={enviar} noValidate>
        {libro ? <>
          {campo('titulo', 'Título de la obra', true, 'Ej. La casa grande o Crónica de una muerte anunciada', 300)}
          {campo('autor', 'Autor o autores', true, 'Ej. Álvaro Cepeda Samudio', 200)}
          {campo('mensaje', '¿Por qué lo sugiere?', false, 'Describa brevemente el aporte de esta obra para la comunidad lectora del Caribe...', 3000, true, 'Indique si es de utilidad para investigación académica, lectura escolar, talleres o interés de la comunidad.')}
        </> : <>
          {campo('nombre', 'Nombre', false, 'Su nombre', 120)}
        </>}
        {/* TODO(HU-XX): texto definitivo a confirmar con la biblioteca (Ley 1581 de 2012). */}
        {campo('correo', 'Correo electrónico', false, 'nombre@ejemplo.com', 254, false, libro ? 'Le notificaremos cuando la sugerencia sea evaluada o incorporada a las salas de lectura.' : undefined)}
        {!libro && campo('mensaje', 'Mensaje', true, 'Escriba su mensaje para la biblioteca...', 3000, true)}
        {fallo && <p role="alert" className={styles.error}>{fallo}</p>}
        <div className={styles.acciones}><Link className={styles.cancelar} to={RUTAS.ayuda}><Icono nombre="close" /> Cancelar</Link><button ref={enviarRef} className={styles.enviar} type="submit" disabled={enviando}><Icono nombre="send" /> {enviando ? 'Enviando…' : libro ? 'Enviar sugerencia' : 'Enviar mensaje'}</button></div>
      </form>
    </div>
    {libro && <div className={styles.tarjetas}>
      <div><span><Icono nombre="support_agent" /></span><div><h2>¿Prefiere solicitarlo en persona?</h2><p>Acérquese al mostrador de referencia en Sala General 04.</p></div></div>
      <div><span><Icono nombre="hub" /></span><div><h2>Préstamo Interbibliotecario</h2><p>Podemos consultar la red de bibliotecas aliadas de Barranquilla.</p></div></div>
    </div>}
    {/* TODO(HU-XX): añadir administración y seguimiento de solicitudes en otro issue. */}
    {confirmado && <DialogoConfirmacion libro={libro} cerrar={cerrar} devolverFoco={devolverFoco} />}
  </div>;
}
