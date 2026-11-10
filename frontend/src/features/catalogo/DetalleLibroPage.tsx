import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  Clipboard,
  ExternalLink,
  Library,
  MapPin,
  Printer,
  Tag,
} from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { RUTAS } from '../../config/rutas';
import { obtenerLibro } from './api/libros.api';
import type { LibroDto } from './types';
import styles from './DetalleLibroPage.module.css';

function nombreTipoMaterial(tipo: LibroDto['tipoMaterial']): string {
  return {
    LIBRO: 'Libro',
    REVISTA: 'Revista',
    TESIS: 'Tesis',
    TRABAJO_DE_GRADO: 'Trabajo de grado',
    MATERIAL_AUDIOVISUAL: 'Material audiovisual',
    OTRO: 'Otro',
  }[tipo];
}

function nombreFormato(formato: LibroDto['formato']): string {
  return {
    FISICO: 'Físico',
    DIGITAL: 'Digital',
    FISICO_Y_DIGITAL: 'Físico y digital',
  }[formato];
}

export function DetalleLibroPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [book, setBook] = useState<LibroDto | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    if (!id) {
      setStatus('error');
      return;
    }

    const controller = new AbortController();
    void obtenerLibro(id, controller.signal)
      .then((result) => {
        setBook(result);
        setStatus('ready');
      })
      .catch(() => {
        if (!controller.signal.aborted) setStatus('error');
      });

    return () => controller.abort();
  }, [id]);

  if (status === 'loading') {
    return <p className={styles.feedback} role="status">Cargando la ficha de la obra…</p>;
  }

  if (status === 'error' || !book) {
    return (
      <section className={styles.feedback} aria-labelledby="detalle-error">
        <h1 id="detalle-error">No pudimos cargar esta obra</h1>
        <p>Verifica la conexión con el catálogo o vuelve a los resultados.</p>
        <button onClick={() => navigate(RUTAS.buscar)} type="button">Volver a resultados</button>
      </section>
    );
  }

  const authors = book.autores.map((author) => author.nombre).join(', ') || 'Autor no registrado';
  const topics = book.temas.map((topic) => topic.nombre);

  return (
    <div className={styles.page}>
      <title>{book.titulo} · Consulta Fácil</title>
      <nav className={styles.breadcrumbs} aria-label="Migas de pan">
        <Link to={RUTAS.buscar}><ArrowLeft aria-hidden="true" size={18} /> Volver a los resultados</Link>
        <span aria-hidden="true">Catálogo</span>
        <span aria-hidden="true">›</span>
        <strong>Detalle de la obra</strong>
        <button aria-label="Imprimir ficha de ubicación" onClick={() => window.print()} type="button">
          <Printer aria-hidden="true" size={17} /> Imprimir ficha
        </button>
      </nav>

      <main className={styles.card}>
        <aside className={styles.coverColumn}>
          <div className={styles.cover} aria-label={`Portada tipográfica de ${book.titulo}`}>
            <span>BIBLIOTECA PILOTO DEL CARIBE</span>
            <strong>{book.titulo}</strong>
            <i>{authors}</i>
            <small>{nombreTipoMaterial(book.tipoMaterial)}</small>
          </div>
          <button className={styles.primaryAction} type="button">
            <MapPin aria-hidden="true" size={19} /> Ver ubicación en estantería
          </button>
          <button className={styles.secondaryAction} type="button">
            <BookOpen aria-hidden="true" size={19} /> Solicitar préstamo en sala
          </button>
          <p className={styles.unavailable}><Library aria-hidden="true" size={17} /> Ubicación y ejemplares: información no disponible en la API actual.</p>
        </aside>

        <article className={styles.content}>
          <p className={styles.collection}><Tag aria-hidden="true" size={16} /> {topics[0] ?? 'Catálogo general'}</p>
          <p className={styles.availability}><span aria-hidden="true" /> Consulta pública disponible</p>
          <h1>{book.titulo}</h1>
          <p className={styles.authors}>Autoría: <strong>{authors}</strong></p>

          <section className={styles.location} aria-labelledby="ubicacion-titulo">
            <h2 id="ubicacion-titulo"><MapPin aria-hidden="true" size={18} /> Ubicación y disponibilidad</h2>
            <p>La ficha bibliográfica está disponible. La signatura, los ejemplares y el estado de sala se mostrarán cuando el servicio de inventario esté conectado.</p>
            <button type="button"><Clipboard aria-hidden="true" size={16} /> Copiar información</button>
          </section>

          <section className={styles.section} aria-labelledby="descripcion-titulo">
            <h2 id="descripcion-titulo"><BookOpen aria-hidden="true" size={18} /> Descripción y sinopsis</h2>
            <p>El catálogo actual no incluye una sinopsis editorial para esta obra. Consulta al personal bibliotecario para conocer su contenido y disponibilidad.</p>
          </section>

          <section className={styles.technical} aria-labelledby="ficha-titulo">
            <h2 id="ficha-titulo"><CalendarDays aria-hidden="true" size={18} /> Ficha técnica esencial</h2>
            <dl>
              <div><dt>Año de publicación</dt><dd>{book.anioPublicacion ?? 'No registrado'}</dd></div>
              <div><dt>Idioma</dt><dd>{book.idioma.toUpperCase()}</dd></div>
              <div><dt>ISBN</dt><dd>{book.isbn ?? 'No registrado'}</dd></div>
              <div><dt>Tipo de material</dt><dd>{nombreTipoMaterial(book.tipoMaterial)}</dd></div>
              <div><dt>Formato</dt><dd>{nombreFormato(book.formato)}</dd></div>
              <div><dt>Enlace digital</dt><dd>{book.enlaceDigital ? <a href={book.enlaceDigital} rel="noreferrer" target="_blank">Abrir enlace <ExternalLink size={14} /></a> : 'No disponible'}</dd></div>
            </dl>
          </section>

          <section className={styles.tags} aria-labelledby="temas-titulo">
            <h2 id="temas-titulo"><Tag aria-hidden="true" size={18} /> Materias y descriptores temáticos</h2>
            <div>{topics.length ? topics.map((topic) => <span key={topic}>{topic}</span>) : <p>No hay temas asociados.</p>}</div>
          </section>
        </article>
      </main>
    </div>
  );
}
