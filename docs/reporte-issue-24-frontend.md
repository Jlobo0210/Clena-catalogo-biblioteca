# Reporte de implementación frontend · Issue 24

## Alcance

Se implementó y ajustó la experiencia frontend de consulta bibliotecaria:

- Vista **Explorar**.
- Vista **Detalle del libro**.
- Estados de carga, error y vacío.
- Responsive para pantallas pequeñas.
- Navegación accesible por teclado.

La vista de resultados todavía conserva su estructura inicial y debe conectarse con la API antes de enlazar cada tarjeta al detalle.

## Vista Explorar

Archivo principal: [`ExplorarPage.tsx`](../frontend/src/features/temas/ExplorarPage.tsx)

Incluye:

- Búsqueda por colecciones y temas.
- Botones visibles **Buscar** y **Limpiar**.
- Filtros por colección.
- Ordenamiento por **Recientes** y **A-Z**.
- Selector de tipo de material.
- Resumen de obras y colección activa.
- Tarjetas horizontales de colecciones.
- Estado vacío con sugerencias.
- Aviso de conexión y botón **Reintentar conexión**.
- Fallback visual con seis colecciones de referencia cuando la API no responde.

Estilos: [`ExplorarPage.module.css`](../frontend/src/features/temas/ExplorarPage.module.css)

El fallback no reemplaza los datos reales: se muestra junto con un aviso para indicar que el backend no está conectado.

## Vista Detalle del libro

Archivo principal: [`DetalleLibroPage.tsx`](../frontend/src/features/catalogo/DetalleLibroPage.tsx)

Ruta:

```text
/libros/:id
```

La vista consulta:

```text
GET /api/v1/libros/:id
```

Muestra:

- Título.
- Autores.
- Temas.
- ISBN.
- Idioma.
- Año de publicación.
- Tipo de material.
- Formato.
- Enlace digital, si existe.
- Ficha técnica.
- Navegación de regreso.
- Acción de impresión.

Estilos: [`DetalleLibroPage.module.css`](../frontend/src/features/catalogo/DetalleLibroPage.module.css)

Adaptador HTTP: [`libros.api.ts`](../frontend/src/features/catalogo/api/libros.api.ts)

## Arquitectura aplicada

```text
API HTTP
  └── features/catalogo/api/libros.api.ts

Tipos compartidos
  └── features/catalogo/types.ts

Presentación
  ├── features/temas/ExplorarPage.tsx
  └── features/catalogo/DetalleLibroPage.tsx

Estilos
  ├── ExplorarPage.module.css
  └── DetalleLibroPage.module.css

Routing
  └── app/RutasApp.tsx
```

Las páginas no realizan llamadas HTTP directamente. Las consultas pasan por los adaptadores del catálogo y reutilizan el `apiClient` existente.

## Cómo probarlo

Desde `frontend/`:

```powershell
npm run dev
```

Explorar:

```text
http://localhost:5173/temas
```

Detalle:

```text
http://localhost:5173/libros/ID_REAL_DEL_LIBRO
```

`ID_REAL_DEL_LIBRO` debe ser un UUID devuelto por el backend.

## Validación realizada

- `npm run build`: aprobado.
- `npm run lint`: aprobado.
- `npm run test -- --run`: 29 pruebas aprobadas.

## Limitaciones actuales

El contrato actual de `LibroResponse` no incluye:

- Signatura topográfica.
- Ubicación física.
- Cantidad de ejemplares.
- Estado de disponibilidad.
- Descripción o sinopsis.

La vista informa estas limitaciones explícitamente y no inventa información bibliográfica.

## Próximo paso recomendado

Completar `BusquedaPage` con:

1. Consulta a `/api/v1/libros/buscar`.
2. Tarjetas de resultados.
3. Estados de carga, error y sin resultados.
4. Enlaces hacia `/libros/:id`.
5. Paginación o carga progresiva.
