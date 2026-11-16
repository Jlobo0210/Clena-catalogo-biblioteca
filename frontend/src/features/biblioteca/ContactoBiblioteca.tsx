import { Mail, Phone, Clock3 } from 'lucide-react';
import { useConfiguracion } from './useConfiguracion';
import styles from './Biblioteca.module.css';
import ayuda from './Ayuda.module.css';

export function ContactoBiblioteca({ compacta = false }: { compacta?: boolean }) {
  const estado = useConfiguracion();
  if (estado.tipo === 'cargando') return <p role="status">Cargando información de contacto y horarios…</p>;
  if (estado.tipo === 'error') return <p role="alert">No fue posible cargar los datos. Intente nuevamente más tarde.</p>;
  if (estado.tipo === 'vacio') return <p>La biblioteca aún no ha publicado información de contacto y horarios.</p>;
  const { horarios, telefono, correo } = estado.datos;
  if (compacta) {
    return (
      <div className={ayuda.contactoColumnas}>
        <div><span className="material-symbols-outlined" aria-hidden="true">schedule</span><div><strong>Horarios</strong><p>{horarios}</p></div></div>
        <div><span className="material-symbols-outlined" aria-hidden="true">call</span><div><strong>Teléfono</strong><p><a href={`tel:${telefono.replace(/[^\d+]/g, '')}`}>{telefono}</a></p></div></div>
        <div><span className="material-symbols-outlined" aria-hidden="true">mail</span><div><strong>Correo</strong><p><a href={`mailto:${correo}`}>{correo}</a></p></div></div>
      </div>
    );
  }
  return (
    <div className={styles.contacto}>
      <div><Clock3 aria-hidden="true" /><div><strong>Horarios</strong><p className={styles.horario}>{horarios}</p></div></div>
      <div><Phone aria-hidden="true" /><div><strong>Teléfono</strong><p><a href={`tel:${telefono.replace(/[^\d+]/g, '')}`}>{telefono}</a></p></div></div>
      <div><Mail aria-hidden="true" /><div><strong>Correo</strong><p><a href={`mailto:${correo}`}>{correo}</a></p></div></div>
    </div>
  );
}
