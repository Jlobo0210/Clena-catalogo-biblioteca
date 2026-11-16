# Auditoría de accesibilidad (HU-33)

**Fecha:** 2026-11-14 · **Issue:** #33 · **PR:** el que cierra #33 (rama `feat/33-auditoria-accesibilidad`)

En P2 la accesibilidad es criterio de aceptación (enunciado, sección 6). Esta auditoría revisa todas las pantallas contra **WCAG 2.2 nivel AA** y deja pruebas automáticas para que no se rompa.

## 1. Cómo se auditó

| Revisión | Herramienta | Alcance |
|---|---|---|
| Reglas automáticas WCAG 2.0, 2.1 y 2.2 A/AA, más buenas prácticas, incluido el **contraste de color** | axe-core 4.10 en Chromium (Playwright), contra el backend real con PostgreSQL y las semillas | 22 pantallas × 2 tamaños (escritorio 1280 px y celular 320 px) = 44 revisiones |
| Reflow (WCAG 1.4.10) | Medición de scroll horizontal | Pantallas de 320 px y 640 px (equivale a zoom del 200 % en una pantalla de 1280 px) |
| Texto al 200 % (WCAG 1.4.4) | Tamaño de letra raíz al 200 % en escritorio | Todas las pantallas |
| Teclado y foco visible (WCAG 2.1.1, 2.4.1, 2.4.7) | Recorrido con Tab de hasta 45 paradas por pantalla | Inicio, resultados, detalle, ingresar, registro, préstamos del personal y libros del panel |

Pantallas revisadas:
- **Públicas:** inicio, resultados con y sin coincidencias, tutorial, detalle del libro, explorar por tema, ingresar, registro, búsqueda avanzada y 404.
- **Usuario con sesión:** mi cuenta y mis préstamos.
- **Personal:** panel, préstamos, autores, temas, importar CSV, libros, libro nuevo, edición de libro y QR.
- **Administración:** usuarios y roles.

## 2. Resultados

| Revisión | Antes | Después |
|---|---|---|
| axe (WCAG 2.2 AA + buenas prácticas), 44 revisiones | 0 violaciones | 0 violaciones |
| Scroll horizontal a 320 px | 1 pantalla (usuarios y roles) | 0 |
| Texto al 200 % en escritorio | 22 de 22 pantallas se salían por el encabezado; además, el detalle del libro | 0 |
| Primer Tab lleva a «Ir al contenido principal» | Sí, en todas | Sí |
| Elementos con foco sin indicador visible | 0 | 0 |

## 3. Hallazgos y correcciones

| # | Hallazgo | Criterio WCAG | Corrección |
|---|---|---|---|
| H1 | Con la letra al 200 %, el encabezado no bajaba de línea. La terminal, «Inicio de sesión» y el botón de reinicio quedaban fuera de la pantalla (página de 1614 px en una ventana de 1280 px). | 1.4.4 Cambio de tamaño del texto | `Encabezado.module.css`: la barra, el bloque de la terminal y la navegación hacen `flex-wrap`, y la marca ya no exige `min-width: max-content`. |
| H2 | `html { min-width: 22.5rem }` crecía con la letra: al 200 % obligaba a 720 px y en el celular aparecía scroll horizontal. | 1.4.4 y 1.4.10 Reflow | `base.css`: el mínimo pasa a `320px`, que no depende del tamaño de letra. |
| H3 | En «Usuarios y roles» a 320 px la página se ensanchaba a 377 px. Las etiquetas ocultas de los selectores de rol (posición absoluta) se ubicaban fuera del contenedor que se desplaza. | 1.4.10 Reflow | Los contenedores de tablas tienen `position: relative` y `min-width: 0`. |
| H4 | Las tablas anchas (préstamos, libros, usuarios, historial, importación) se desplazan dentro de su caja, pero esa caja no se podía mover con el teclado cuando la tabla no tiene botones. | 2.1.1 Teclado | Nuevo componente `TablaDesplazable`: cuando la tabla no cabe, el contenedor es una región con nombre y `tabindex="0"`, y se mueve con las flechas. Cuando cabe, no agrega una parada de Tab. Se usa en las 8 tablas. |
| H5 | En el detalle del libro, con la letra al 200 %, las dos columnas fijas (portada y ficha) empujaban la ficha técnica fuera de la pantalla. | 1.4.4 | `DetalleLibroPage.module.css`: la tarjeta usa flex con salto de línea y la ficha técnica usa columnas automáticas. En tamaño normal se ve igual que antes. |

Capturas después de corregir:
- `imagenes/hu-33/inicio-texto-200.png`: encabezado con la letra al 200 %.
- `imagenes/hu-33/detalle-texto-200.png`: detalle del libro con la letra al 200 %.
- `imagenes/hu-33/usuarios-320px.png`: usuarios y roles a 320 px; la tabla se desplaza sola.

## 4. Lo que ya estaba bien

Lo confirmó la auditoría:
- Contraste AA en todos los textos, revisado por axe en el navegador.
- Etiquetas visibles en todos los campos y resúmenes de error con `role="alert"`.
- Tablas con `caption` y `th scope`.
- Enlace «Ir al contenido principal» y foco visible en todos los controles.
- Diálogo del tutorial con `aria-modal`; el foco no se escapa y Escape lo cierra.
- Estados que no dependen solo del color: vencido o disponible llevan ícono y texto.

## 5. Observaciones pendientes (no son fallas WCAG)

- Los íconos tienen tamaño en píxeles, así que no crecen con la letra. Son decorativos (`aria-hidden`) y el texto sí crece. Se podría pasar a `1.25em` más adelante.
- Falta una prueba con lector de pantalla real (NVDA o TalkBack) con usuarios del CLENA. Se propone hacerla en la Sprint Review del Sprint 3 con G8.

## 6. Cómo volver a revisarlo

- **Automático, en cada PR:** `frontend/src/test/accesibilidad.test.tsx` corre axe sobre estas pantallas:
  - Resultados de búsqueda.
  - Detalle del libro.
  - Tutorial.
  - Ingresar.
  - Mi cuenta, con el formulario de eliminar cuenta abierto.
  - Panel.

  El CI falla si aparece una violación. En jsdom no se calcula el contraste; el contraste se revisa en el navegador.
- **Manual:**
  - Con `docker compose up`, abrir la página en Chrome.
  - Correr Lighthouse, pestaña Accesibilidad.
  - Probar el zoom al 200 % (Ctrl +) y el ancho de 320 px en las herramientas de desarrollo.
