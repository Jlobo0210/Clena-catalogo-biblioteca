import type { FiltrosBusqueda } from '../api/busqueda.api';
import styles from './PanelFiltros.module.css';

const TIPOS_MATERIAL = [
  { valor: '', etiqueta: 'Todos los tipos' },
  { valor: 'LIBRO', etiqueta: 'Libro' },
  { valor: 'REVISTA', etiqueta: 'Revista' },
  { valor: 'TESIS', etiqueta: 'Tesis' },
  { valor: 'TRABAJO_DE_GRADO', etiqueta: 'Trabajo de grado' },
  { valor: 'MATERIAL_AUDIOVISUAL', etiqueta: 'Material audiovisual' },
  { valor: 'OTRO', etiqueta: 'Otro' },
];

const IDIOMAS = [
  { valor: '', etiqueta: 'Todos los idiomas' },
  { valor: 'es', etiqueta: 'Español' },
  { valor: 'en', etiqueta: 'Inglés' },
  { valor: 'fr', etiqueta: 'Francés' },
  { valor: 'pt', etiqueta: 'Portugués' },
];

const ORDENES = [
  { valor: 'relevancia', etiqueta: 'Relevancia' },
  { valor: 'titulo', etiqueta: 'Título (A–Z)' },
  { valor: 'anio', etiqueta: 'Año (más reciente)' },
];

interface PanelFiltrosProps {
  filtros: FiltrosBusqueda;
  onChange: (cambios: Partial<FiltrosBusqueda>) => void;
}

export function PanelFiltros({ filtros, onChange }: PanelFiltrosProps) {
  return (
    <aside aria-label="Filtros de búsqueda" className={styles.panel}>
      <h2 className={styles.titulo}>Filtrar resultados</h2>

      <div className={styles.grupo}>
        <label className={styles.etiqueta} htmlFor="filtro-tipo">
          Tipo de material
        </label>
        <select
          className={styles.selector}
          id="filtro-tipo"
          onChange={(e) =>
            onChange({ tipoMaterial: e.target.value || undefined })
          }
          value={filtros.tipoMaterial ?? ''}
        >
          {TIPOS_MATERIAL.map((op) => (
            <option key={op.valor} value={op.valor}>
              {op.etiqueta}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.grupo}>
        <label className={styles.etiqueta} htmlFor="filtro-idioma">
          Idioma
        </label>
        <select
          className={styles.selector}
          id="filtro-idioma"
          onChange={(e) => onChange({ idioma: e.target.value || undefined })}
          value={filtros.idioma ?? ''}
        >
          {IDIOMAS.map((op) => (
            <option key={op.valor} value={op.valor}>
              {op.etiqueta}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.grupo}>
        <span className={styles.etiqueta}>Año de publicación</span>
        <div className={styles.rangoAnio}>
          <label className="visualmente-oculto" htmlFor="filtro-anio-desde">
            Desde el año
          </label>
          <input
            className={styles.inputAnio}
            id="filtro-anio-desde"
            max={new Date().getFullYear()}
            min={1000}
            onChange={(e) =>
              onChange({
                anioDesde: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            placeholder="Desde"
            type="number"
            value={filtros.anioDesde ?? ''}
          />
          <span aria-hidden="true" className={styles.guion}>
            –
          </span>
          <label className="visualmente-oculto" htmlFor="filtro-anio-hasta">
            Hasta el año
          </label>
          <input
            className={styles.inputAnio}
            id="filtro-anio-hasta"
            max={new Date().getFullYear()}
            min={1000}
            onChange={(e) =>
              onChange({
                anioHasta: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            placeholder="Hasta"
            type="number"
            value={filtros.anioHasta ?? ''}
          />
        </div>
      </div>

      <div className={styles.grupo}>
        <label className={styles.checkLabel} htmlFor="filtro-disponible">
          <input
            checked={filtros.soloDisponibles ?? false}
            className={styles.check}
            id="filtro-disponible"
            onChange={(e) => onChange({ soloDisponibles: e.target.checked })}
            type="checkbox"
          />
          Solo con ejemplares disponibles
        </label>
      </div>

      <div className={styles.grupo}>
        <label className={styles.etiqueta} htmlFor="filtro-orden">
          Ordenar por
        </label>
        <select
          className={styles.selector}
          id="filtro-orden"
          onChange={(e) =>
            onChange({
              ordenarPor: e.target.value as FiltrosBusqueda['ordenarPor'],
            })
          }
          value={filtros.ordenarPor ?? 'relevancia'}
        >
          {ORDENES.map((op) => (
            <option key={op.valor} value={op.valor}>
              {op.etiqueta}
            </option>
          ))}
        </select>
      </div>
    </aside>
  );
}
