#!/usr/bin/env bash
# Crea labels, milestones e issues del Product Backlog en GitHub y (opcional) los agrega al Project.
# Uso:  REPO=usuario/repositorio [PROJECT_OWNER=usuario PROJECT_NUMBER=1] ./crear-backlog-github.sh
# Requisitos: gh autenticado (gh auth login) y, para el Project, gh auth refresh -s project
# Ejecutar UNA sola vez: volver a ejecutarlo duplica los issues.
set -euo pipefail
: "${REPO:?Define REPO=usuario/repositorio}"
PROJECT_OWNER="${PROJECT_OWNER:-}"
PROJECT_NUMBER="${PROJECT_NUMBER:-}"

echo "== Labels"
gh label create 'historia' --repo "$REPO" --color 1D76DB --description 'Historia de usuario' --force
gh label create 'tarea-tecnica' --repo "$REPO" --color 5319E7 --description 'Trabajo técnico necesario para las historias' --force
gh label create 'bug' --repo "$REPO" --color D73A4A --description 'Algo no funciona' --force
gh label create 'docs' --repo "$REPO" --color 0075CA --description 'Documentación' --force
gh label create 'backend' --repo "$REPO" --color 0E8A16 --description 'API NestJS' --force
gh label create 'frontend' --repo "$REPO" --color FBCA04 --description 'React' --force
gh label create 'database' --repo "$REPO" --color C5DEF5 --description 'PostgreSQL, migraciones, seeds' --force
gh label create 'devops' --repo "$REPO" --color BFD4F2 --description 'Docker, CI, despliegue' --force
gh label create 'accesibilidad' --repo "$REPO" --color F9D0C4 --description 'Criterio de aceptación obligatorio en P2' --force
gh label create 'prioridad:alta' --repo "$REPO" --color B60205 --description 'Imprescindible (Must)' --force
gh label create 'prioridad:media' --repo "$REPO" --color D93F0B --description 'Importante (Should)' --force
gh label create 'prioridad:baja' --repo "$REPO" --color FEF2C0 --description 'Deseable (Could)' --force
gh label create 'epic:infra' --repo "$REPO" --color EDEDED --description 'Base técnica' --force
gh label create 'epic:auth' --repo "$REPO" --color EDEDED --description 'Autenticación y roles' --force
gh label create 'epic:catalogo' --repo "$REPO" --color EDEDED --description 'Gestión del catálogo' --force
gh label create 'epic:busqueda' --repo "$REPO" --color EDEDED --description 'Búsqueda y resultados' --force
gh label create 'epic:prestamos' --repo "$REPO" --color EDEDED --description 'Préstamos y alertas' --force
gh label create 'epic:acceso-movil' --repo "$REPO" --color EDEDED --description 'QR y tutorial' --force
gh label create 'epic:datos-personales' --repo "$REPO" --color EDEDED --description 'Ley 1581 de 2012' --force
gh label create 'epic:entrega' --repo "$REPO" --color EDEDED --description 'Despliegue, manuales y aceptación' --force

echo "== Milestones"
gh api "repos/$REPO/milestones" -f title='Inception' -f due_on='2026-10-18T23:59:59Z' -f description='Reunión con el equipo de Introducción, backlog validado, modelo de dominio, diagrama ER y arquitectura en docs/.' >/dev/null || echo "  (milestone Inception ya existe)"
gh api "repos/$REPO/milestones" -f title='Sprint 1' -f due_on='2026-10-30T23:59:59Z' -f description='Objetivo: base técnica, autenticación, roles, CRUD de las entidades núcleo y CI funcionando.' >/dev/null || echo "  (milestone Sprint 1 ya existe)"
gh api "repos/$REPO/milestones" -f title='Sprint 2' -f due_on='2026-11-13T23:59:59Z' -f description='Objetivo: búsqueda tolerante a errores, importación CSV, préstamos, frontend integrado y pruebas e2e.' >/dev/null || echo "  (milestone Sprint 2 ya existe)"
gh api "repos/$REPO/milestones" -f title='Sprint 3' -f due_on='2026-11-27T23:59:59Z' -f description='Objetivo: QR, tutorial, alertas, accesibilidad, despliegue, manuales y acta de aceptación.' >/dev/null || echo "  (milestone Sprint 3 ya existe)"

if [[ -n "$PROJECT_NUMBER" ]]; then
  PROJECT_ID=$(gh project view "$PROJECT_NUMBER" --owner "$PROJECT_OWNER" --format json --jq .id)
  PUNTOS_ID=$(gh project field-list "$PROJECT_NUMBER" --owner "$PROJECT_OWNER" --format json --jq '.fields[] | select(.name=="Puntos") | .id')
fi

crear() {  # titulo milestone puntos labels body
  local url item
  url=$(gh issue create --repo "$REPO" --title "$1" --milestone "$2" --label "$4" --body "$5")
  echo "  $url"
  if [[ -n "$PROJECT_NUMBER" ]]; then
    item=$(gh project item-add "$PROJECT_NUMBER" --owner "$PROJECT_OWNER" --url "$url" --format json --jq .id)
    if [[ -n "${PUNTOS_ID:-}" ]]; then
      gh project item-edit --id "$item" --project-id "$PROJECT_ID" --field-id "$PUNTOS_ID" --number "$3" >/dev/null
    fi
  fi
}

echo "== Issues"
crear 'HU-01 Validar y priorizar el Product Backlog con el equipo de Introducción' 'Inception' 1 'tarea-tecnica,docs,prioridad:alta' '**Como** Product Owner **quiero** revisar este backlog con el contacto del equipo de Introducción **para** que las prioridades reflejen lo observado en la Biblioteca del CLENA.

### Criterios de aceptación
- [ ] El backlog se revisa en una reunión grabada en Teams con el contacto del equipo de Introducción.
- [ ] Las historias quedan ordenadas por prioridad en la columna Backlog del tablero.
- [ ] Los cambios acordados se registran en el acta de la reunión con enlace a este issue.

### Estimación
1 puntos

### Prioridad
Must

### Origen
PDF §4 y Hito 1
'
crear 'HU-02 Documentar el modelo de dominio y el diagrama ER' 'Inception' 3 'tarea-tecnica,docs,database,prioridad:alta' '**Como** integrante del equipo **quiero** un modelo de dominio y un diagrama entidad-relación del catálogo **para** que todos implementemos las mismas entidades (Libro, Autor, Tema, Ejemplar, Ubicación, Préstamo, Usuario).

### Criterios de aceptación
- [ ] docs/modelo-datos.md contiene el diagrama ER (Mermaid o imagen) y la descripción de cada entidad.
- [ ] Se identifican las columnas de búsqueda que llevarán índice.
- [ ] El PR que lo agrega tiene al menos una aprobación.

### Estimación
3 puntos

### Prioridad
Must

### Origen
PDF §6 Base de datos
'
crear 'HU-03 Documentar la arquitectura y las decisiones técnicas' 'Inception' 2 'tarea-tecnica,docs,prioridad:alta' '**Como** integrante del equipo **quiero** docs/arquitectura.md con el diagrama de capas y las decisiones técnicas **para** respetar Clean Architecture y poder explicarla en la sustentación.

### Criterios de aceptación
- [ ] Incluye diagrama de capas (dominio, aplicación, infraestructura, presentación) y la regla de dependencia.
- [ ] Justifica la elección de ORM, librería de validación, logger y librería de componentes.
- [ ] Describe la estrategia de búsqueda tolerante a errores (por ejemplo pg_trgm + unaccent).

### Estimación
2 puntos

### Prioridad
Must

### Origen
PDF §5
'
crear 'HU-04 Configurar el repositorio: README, protección de main y plantillas' 'Inception' 1 'tarea-tecnica,devops,prioridad:alta' '**Como** Scrum Master **quiero** el repositorio con main protegida, plantillas de issue y PR y el README inicial **para** que todo el equipo trabaje con GitHub Flow desde el primer commit.

### Criterios de aceptación
- [ ] main no acepta push directo; exige PR con 1 aprobación y CI en verde.
- [ ] Existen .github/pull_request_template.md y la plantilla de historia de usuario.
- [ ] README.md con descripción, problema, equipo de origen e integrantes.
- [ ] djromerom es colaborador del repositorio.

### Estimación
1 puntos

### Prioridad
Must

### Origen
PDF §7 y Hito 0
'
crear 'HU-05 Estructura del backend NestJS con Clean Architecture' 'Sprint 1' 3 'tarea-tecnica,backend,epic:infra,prioridad:alta' '**Como** integrante del equipo **quiero** una estructura base del backend separada en dominio, aplicación, infraestructura y presentación **para** que la regla de dependencia se cumpla desde el inicio.

### Criterios de aceptación
- [ ] El dominio es TypeScript puro: una regla de ESLint (no-restricted-imports) falla si importa @nestjs, el ORM u otra librería de infraestructura.
- [ ] Los casos de uso reciben interfaces de repositorio inyectadas por token.
- [ ] Las entidades del ORM no salen de infraestructura (se mapean a entidades de dominio).

### Estimación
3 puntos

### Prioridad
Must

### Origen
PDF §5
'
crear 'HU-06 Estructura del frontend React + TypeScript' 'Sprint 1' 2 'tarea-tecnica,frontend,epic:infra,prioridad:alta' '**Como** integrante del equipo **quiero** un proyecto React con TypeScript, enrutador y layout base accesible **para** construir las pantallas sobre una base común.

### Criterios de aceptación
- [ ] Proyecto creado con Vite (o similar) en frontend/.
- [ ] Layout con encabezado, navegación por teclado y tamaño de letra escalable.
- [ ] Cliente HTTP configurado con la URL de la API por variable de entorno.

### Estimación
2 puntos

### Prioridad
Must

### Origen
PDF §5
'
crear 'HU-07 docker-compose levanta backend, frontend y PostgreSQL' 'Sprint 1' 3 'tarea-tecnica,devops,epic:infra,prioridad:alta' '**Como** integrante del equipo **quiero** levantar todo el sistema con docker-compose up **para** que cualquiera (incluido el CLENA) pueda ejecutarlo sin pasos manuales.

### Criterios de aceptación
- [ ] docker-compose up levanta backend, frontend y PostgreSQL 15+ y aplica migraciones.
- [ ] .env.example documenta todas las variables; no hay secretos en el código.
- [ ] Las instrucciones están en el README.

### Estimación
3 puntos

### Prioridad
Must

### Origen
PDF §6 Calidad
'
crear 'HU-08 CI con GitHub Actions: lint, pruebas y build en cada PR' 'Sprint 1' 3 'tarea-tecnica,devops,epic:infra,prioridad:alta' '**Como** integrante del equipo **quiero** que cada Pull Request ejecute lint, pruebas y build **para** fusionar a main solo código que funciona.

### Criterios de aceptación
- [ ] El workflow corre en pull_request hacia main para backend y frontend.
- [ ] El check del CI está marcado como requerido en la protección de main.
- [ ] Se reporta la cobertura de dominio y aplicación (mínimo 70 %).

### Estimación
3 puntos

### Prioridad
Must

### Origen
PDF §6 Calidad
'
crear 'HU-09 Base de la API: /api/v1, Swagger, /health, logs y errores uniformes' 'Sprint 1' 3 'tarea-tecnica,backend,epic:infra,prioridad:alta' '**Como** integrante del equipo **quiero** la configuración transversal de la API **para** cumplir los requisitos técnicos mínimos en todos los módulos.

### Criterios de aceptación
- [ ] Todas las rutas cuelgan de /api/v1 y la documentación Swagger está en /docs.
- [ ] GET /health responde el estado de la API y de la base de datos.
- [ ] Un filtro global devuelve errores con formato uniforme; ValidationPipe valida todos los DTOs.
- [ ] Los logs son estructurados (JSON).

### Estimación
3 puntos

### Prioridad
Must

### Origen
PDF §6 Backend
'
crear 'HU-10 Migraciones versionadas y datos semilla ficticios' 'Sprint 1' 3 'tarea-tecnica,database,epic:catalogo,prioridad:alta' '**Como** integrante del equipo **quiero** migraciones y un script de semillas con libros, autores, temas, ejemplares y ubicaciones ficticias **para** tener datos de demostración sin usar datos reales del CLENA.

### Criterios de aceptación
- [ ] synchronize está desactivado fuera de desarrollo local.
- [ ] El script de semillas crea al menos 50 libros ficticios y un usuario por rol.
- [ ] Las columnas de búsqueda (título, autor, tema) tienen índices.

### Estimación
3 puntos

### Prioridad
Must

### Origen
PDF §6 Base de datos y §10
'
crear 'HU-11 Registro de usuario público con aviso de privacidad' 'Sprint 1' 3 'historia,backend,epic:auth,epic:datos-personales,prioridad:alta' '**Como** visitante de la biblioteca **quiero** crear una cuenta aceptando el aviso de privacidad **para** poder pedir préstamos y recibir alertas.

### Criterios de aceptación
- [ ] El registro solo pide los datos mínimos necesarios.
- [ ] El usuario debe aceptar explícitamente el aviso de privacidad (Ley 1581 de 2012); se guarda la fecha del consentimiento.
- [ ] La contraseña se guarda con hash bcrypt o argon2.

### Estimación
3 puntos

### Prioridad
Must

### Origen
PDF §6 y §10
'
crear 'HU-12 Inicio de sesión con JWT (access y refresh token)' 'Sprint 1' 5 'historia,backend,epic:auth,prioridad:alta' '**Como** usuario registrado **quiero** iniciar sesión y mantener mi sesión activa **para** usar el sistema sin volver a ingresar mis datos a cada rato.

### Criterios de aceptación
- [ ] POST /api/v1/auth/login devuelve access token y refresh token.
- [ ] POST /api/v1/auth/refresh renueva el access token; el logout invalida el refresh token.
- [ ] Credenciales inválidas devuelven 401 con el formato de error uniforme.

### Estimación
5 puntos

### Prioridad
Must

### Origen
PDF §6 Backend
'
crear 'HU-13 Autorización por roles: administrador, personal del CLENA y público' 'Sprint 1' 3 'historia,backend,epic:auth,prioridad:alta' '**Como** administrador **quiero** asignar roles a los usuarios **para** que solo el personal pueda modificar el catálogo y registrar préstamos.

### Criterios de aceptación
- [ ] Existen los roles administrador, personal y público.
- [ ] Un guard bloquea con 403 las rutas que el rol no puede usar.
- [ ] El administrador puede listar usuarios (paginado) y cambiar su rol.

### Estimación
3 puntos

### Prioridad
Must

### Origen
PDF §6 Backend
'
crear 'HU-14 Gestión de autores' 'Sprint 1' 2 'historia,backend,epic:catalogo,prioridad:alta' '**Como** personal del CLENA **quiero** crear, consultar, editar y eliminar autores **para** mantener el catálogo actualizado.

### Criterios de aceptación
- [ ] CRUD en /api/v1/autores con validación de DTOs.
- [ ] El listado tiene paginación, filtro por nombre y ordenamiento.
- [ ] No se puede eliminar un autor con libros asociados (error claro).

### Estimación
2 puntos

### Prioridad
Must

### Origen
Alcance mínimo P2
'
crear 'HU-15 Gestión de temas' 'Sprint 1' 2 'historia,backend,epic:catalogo,prioridad:alta' '**Como** personal del CLENA **quiero** crear, consultar, editar y eliminar temas **para** clasificar los libros para la búsqueda por tema.

### Criterios de aceptación
- [ ] CRUD en /api/v1/temas con validación de DTOs.
- [ ] El listado tiene paginación, filtro y ordenamiento.
- [ ] Los temas se cargan en las semillas (incluidos los propuestos por el equipo de Introducción).

### Estimación
2 puntos

### Prioridad
Must

### Origen
Alcance mínimo P2
'
crear 'HU-16 Gestión de libros' 'Sprint 1' 5 'historia,backend,epic:catalogo,prioridad:alta' '**Como** personal del CLENA **quiero** registrar libros con título, autores, temas, año, idioma, ISBN, tipo de material y formato (físico o digital) **para** que los visitantes puedan encontrarlos.

### Criterios de aceptación
- [ ] CRUD en /api/v1/libros; un libro puede tener varios autores y temas.
- [ ] El ISBN es único cuando existe.
- [ ] Un libro digital guarda su enlace de acceso.
- [ ] El listado tiene paginación, filtros y ordenamiento.

### Estimación
5 puntos

### Prioridad
Must

### Origen
Alcance mínimo P2
'
crear 'HU-17 Gestión de ejemplares con ubicación física' 'Sprint 1' 5 'historia,backend,epic:catalogo,prioridad:alta' '**Como** personal del CLENA **quiero** registrar los ejemplares de cada libro con su sala, sección y estante **para** que el visitante sepa dónde buscar el libro.

### Criterios de aceptación
- [ ] CRUD en /api/v1/libros/{id}/ejemplares con código de inventario único.
- [ ] Cada ejemplar tiene ubicación (sala, sección, estante) y estado (disponible, prestado, en reparación, perdido).
- [ ] La disponibilidad del libro se calcula a partir de sus ejemplares.

### Estimación
5 puntos

### Prioridad
Must

### Origen
Alcance mínimo P2
'
crear 'HU-18 Inicio de sesión y rutas protegidas en el frontend' 'Sprint 2' 3 'historia,frontend,epic:auth,prioridad:alta' '**Como** usuario registrado **quiero** iniciar sesión desde la página web **para** acceder a las funciones de mi rol.

### Criterios de aceptación
- [ ] Pantallas de registro e inicio de sesión con etiquetas en todos los campos.
- [ ] Las rutas del personal y del administrador están protegidas según el rol.
- [ ] El token se renueva automáticamente y el usuario puede cerrar sesión.

### Estimación
3 puntos

### Prioridad
Must

### Origen
PDF §6 Frontend
'
crear 'HU-19 Importación del catálogo desde CSV' 'Sprint 2' 5 'historia,backend,frontend,epic:catalogo,prioridad:alta' '**Como** personal del CLENA **quiero** cargar libros y ejemplares desde un archivo CSV **para** no tener que registrarlos uno por uno.

### Criterios de aceptación
- [ ] Se puede descargar una plantilla CSV con las columnas esperadas.
- [ ] Cada fila se valida; al final se muestra un reporte con filas importadas y errores por número de fila.
- [ ] Los autores y temas que no existen se crean; los libros no se duplican por ISBN.

### Estimación
5 puntos

### Prioridad
Must

### Origen
Alcance mínimo P2
'
crear 'HU-20 Búsqueda simple por título, autor o tema' 'Sprint 2' 5 'historia,backend,epic:busqueda,prioridad:alta' '**Como** visitante de la biblioteca **quiero** escribir en un solo campo el título, el autor o el tema que busco **para** encontrar un libro sin saber usar un sistema complicado.

### Criterios de aceptación
- [ ] GET /api/v1/libros/buscar?q= busca en título, autores y temas.
- [ ] No requiere iniciar sesión.
- [ ] La respuesta está paginada y ordenada por relevancia.

### Estimación
5 puntos

### Prioridad
Must

### Origen
Alcance mínimo P2
'
crear 'HU-21 Tolerancia a errores de escritura en la búsqueda' 'Sprint 2' 5 'historia,backend,database,epic:busqueda,prioridad:alta' '**Como** visitante de la biblioteca **quiero** encontrar resultados aunque escriba con errores o sin tildes **para** no quedarme sin respuesta por un error de ortografía.

### Criterios de aceptación
- [ ] Buscar «garcia marques» encuentra «García Márquez».
- [ ] Buscar «cien anos soledad» encuentra «Cien años de soledad».
- [ ] La búsqueda usa índices (por ejemplo pg_trgm + unaccent) y responde en menos de 1 s con los datos semilla.

### Estimación
5 puntos

### Prioridad
Must

### Origen
Alcance mínimo P2
'
crear 'HU-22 Filtros y ordenamiento de los resultados' 'Sprint 2' 3 'historia,backend,epic:busqueda,prioridad:alta' '**Como** estudiante o investigador **quiero** filtrar los resultados por tipo de material, idioma, año, tema y disponibilidad **para** llegar rápido al material que necesito.

### Criterios de aceptación
- [ ] Los filtros se combinan con la búsqueda por texto.
- [ ] Se puede ordenar por relevancia, título y año.
- [ ] Los filtros se reflejan en la URL para poder compartir la búsqueda.

### Estimación
3 puntos

### Prioridad
Must

### Origen
Alcance mínimo P2 y propuesta del equipo de Introducción
'
crear 'HU-23 Detalle del libro con ubicación física y disponibilidad' 'Sprint 2' 3 'historia,backend,epic:busqueda,prioridad:alta' '**Como** visitante de la biblioteca **quiero** ver en el resultado en qué sala, sección y estante está el libro y si está disponible **para** ir directo a buscarlo o saber si puedo leerlo en digital.

### Criterios de aceptación
- [ ] El detalle muestra cada ejemplar con sala, sección, estante y estado.
- [ ] Indica cuántos ejemplares están disponibles y si existe versión digital con su enlace.
- [ ] Si no hay ejemplares disponibles, muestra la fecha estimada de devolución más próxima.

### Estimación
3 puntos

### Prioridad
Must

### Origen
Alcance mínimo P2
'
crear 'HU-24 Pantallas de búsqueda, resultados y detalle' 'Sprint 2' 5 'historia,frontend,accesibilidad,epic:busqueda,prioridad:alta' '**Como** visitante de la biblioteca **quiero** una pantalla de búsqueda clara con un campo grande, filtros visibles y resultados fáciles de leer **para** usarla aunque sea mi primera vez.

### Criterios de aceptación
- [ ] Diseño responsive usable en un celular de 360 px de ancho.
- [ ] Botones visibles de Buscar y Limpiar, como propuso el equipo de Introducción.
- [ ] Contraste AA, etiquetas en formularios y navegación completa por teclado.
- [ ] Mensajes claros cuando no hay resultados, con sugerencias.

### Estimación
5 puntos

### Prioridad
Must

### Origen
Alcance mínimo P2 y propuesta del equipo de Introducción
'
crear 'HU-25 Panel del personal para gestionar el catálogo' 'Sprint 2' 5 'historia,frontend,epic:catalogo,prioridad:alta' '**Como** personal del CLENA **quiero** gestionar libros, autores, temas y ejemplares desde la página web **para** mantener el catálogo sin usar herramientas técnicas.

### Criterios de aceptación
- [ ] Listados con paginación, filtros y ordenamiento.
- [ ] Formularios con validación y mensajes de error comprensibles.
- [ ] Pantalla de importación CSV con el reporte de resultados.

### Estimación
5 puntos

### Prioridad
Must

### Origen
Alcance mínimo P2
'
crear 'HU-26 Registro de préstamos y devoluciones' 'Sprint 2' 5 'historia,backend,frontend,epic:prestamos,prioridad:alta' '**Como** personal del CLENA **quiero** registrar el préstamo de un ejemplar a un usuario y su devolución **para** saber qué libros están prestados y a quién.

### Criterios de aceptación
- [ ] Al prestar, el ejemplar pasa a «prestado» y se calcula la fecha límite de devolución.
- [ ] No se puede prestar un ejemplar que no está disponible.
- [ ] Al devolver, el ejemplar vuelve a «disponible» y queda el historial del préstamo.

### Estimación
5 puntos

### Prioridad
Must

### Origen
Alcance mínimo P2 (propuesta de G7)
'
crear 'HU-27 Consulta de mis préstamos' 'Sprint 2' 2 'historia,backend,frontend,epic:prestamos,prioridad:media' '**Como** usuario registrado **quiero** ver mis préstamos activos y sus fechas de devolución **para** devolver a tiempo.

### Criterios de aceptación
- [ ] Lista los préstamos activos e históricos del usuario autenticado.
- [ ] Resalta los préstamos vencidos o próximos a vencer.

### Estimación
2 puntos

### Prioridad
Should

### Origen
Alcance mínimo P2
'
crear 'HU-28 Pruebas e2e de los flujos principales de la API' 'Sprint 2' 3 'tarea-tecnica,backend,epic:infra,prioridad:alta' '**Como** integrante del equipo **quiero** pruebas e2e de autenticación, búsqueda, gestión de catálogo y préstamos **para** detectar regresiones antes de fusionar.

### Criterios de aceptación
- [ ] Las pruebas e2e corren en el CI contra una base PostgreSQL de prueba.
- [ ] Cubren al menos login, búsqueda con errores de escritura, creación de libro y préstamo/devolución.

### Estimación
3 puntos

### Prioridad
Must

### Origen
PDF §6 Calidad
'
crear 'HU-29 Alertas de devolución' 'Sprint 3' 5 'historia,backend,epic:prestamos,prioridad:alta' '**Como** usuario con un préstamo **quiero** recibir un recordatorio antes de la fecha de devolución y un aviso si me paso **para** no olvidar devolver el libro.

### Criterios de aceptación
- [ ] Una tarea programada envía un correo N días antes del vencimiento (N configurable).
- [ ] Se envía un aviso cuando el préstamo vence.
- [ ] El envío de correo está detrás de un puerto de aplicación (adaptador en infraestructura).

### Estimación
5 puntos

### Prioridad
Must

### Origen
Alcance mínimo P2 (propuesta de G7)
'
crear 'HU-30 Alertas de disponibilidad' 'Sprint 3' 5 'historia,backend,frontend,epic:prestamos,prioridad:alta' '**Como** visitante de la biblioteca **quiero** pedir que me avisen cuando un libro sin ejemplares disponibles vuelva a estarlo **para** no tener que preguntar todos los días.

### Criterios de aceptación
- [ ] El usuario puede suscribirse desde el detalle de un libro no disponible.
- [ ] Cuando se devuelve un ejemplar, los suscritos reciben un aviso y la suscripción se cierra.
- [ ] El usuario puede cancelar la suscripción.

### Estimación
5 puntos

### Prioridad
Must

### Origen
Alcance mínimo P2 (propuesta de G7)
'
crear 'HU-31 Acceso desde el celular por código QR' 'Sprint 3' 3 'historia,frontend,backend,epic:acceso-movil,prioridad:alta' '**Como** visitante de la biblioteca **quiero** escanear un código QR en la biblioteca y abrir la búsqueda en mi celular **para** buscar libros sin usar el computador de la sala.

### Criterios de aceptación
- [ ] El personal puede descargar e imprimir el QR que abre la búsqueda.
- [ ] Opcional: QR por estante o sección que abre los libros de esa ubicación.
- [ ] La página que abre el QR funciona bien en celular.

### Estimación
3 puntos

### Prioridad
Must

### Origen
Alcance mínimo P2
'
crear 'HU-32 Tutorial guiado para la primera búsqueda' 'Sprint 3' 3 'historia,frontend,accesibilidad,epic:acceso-movil,prioridad:alta' '**Como** visitante que usa el sistema por primera vez **quiero** un tutorial paso a paso que me enseñe a hacer mi primera búsqueda **para** encontrar un libro sin pedir ayuda.

### Criterios de aceptación
- [ ] El tutorial aparece la primera vez y se puede saltar o repetir desde un botón visible.
- [ ] Explica dónde escribir, cómo usar filtros y cómo leer la ubicación del libro.
- [ ] Funciona con teclado y lector de pantalla.

### Estimación
3 puntos

### Prioridad
Must

### Origen
Alcance mínimo P2
'
crear 'HU-33 Auditoría de accesibilidad' 'Sprint 3' 3 'tarea-tecnica,frontend,accesibilidad,prioridad:alta' '**Como** visitante adulto mayor **quiero** textos grandes, buen contraste y navegación simple **para** usar el catálogo sin dificultad.

### Criterios de aceptación
- [ ] Las pantallas públicas pasan una auditoría con Lighthouse o axe sin errores críticos.
- [ ] Se puede aumentar el tamaño de letra sin romper el diseño.
- [ ] Los hallazgos y correcciones quedan en docs/ con enlace a los PRs.

### Estimación
3 puntos

### Prioridad
Must

### Origen
PDF §6 Frontend (criterio de aceptación en P2)
'
crear 'HU-34 Eliminación de cuenta y datos personales' 'Sprint 3' 2 'historia,backend,frontend,epic:datos-personales,prioridad:alta' '**Como** usuario registrado **quiero** eliminar mi cuenta y mis datos personales **para** ejercer mis derechos según la Ley 1581 de 2012.

### Criterios de aceptación
- [ ] El usuario puede eliminar su cuenta desde su perfil, con confirmación.
- [ ] Se anonimizan los datos personales conservando el historial de préstamos sin identificar a la persona.
- [ ] No se puede eliminar la cuenta con préstamos activos (mensaje claro).

### Estimación
2 puntos

### Prioridad
Must

### Origen
PDF §10
'
crear 'HU-35 Exploración por categorías temáticas' 'Sprint 3' 3 'historia,frontend,epic:busqueda,prioridad:media' '**Como** estudiante **quiero** explorar el catálogo por categorías sin conocer un título o autor **para** descubrir material sobre un tema.

### Criterios de aceptación
- [ ] Sección separada de la búsqueda general con las categorías del catálogo.
- [ ] Al elegir una categoría se listan sus libros con los mismos filtros de la búsqueda.

### Estimación
3 puntos

### Prioridad
Should

### Origen
Propuesta del equipo de Introducción (búsqueda temática)
'
crear 'HU-36 Préstamos vencidos para el personal' 'Sprint 3' 2 'historia,frontend,backend,epic:prestamos,prioridad:media' '**Como** personal del CLENA **quiero** ver los préstamos vencidos y próximos a vencer **para** hacer seguimiento a las devoluciones.

### Criterios de aceptación
- [ ] Listado paginado con filtros por estado y fecha.
- [ ] Muestra usuario, libro, ejemplar y días de retraso.

### Estimación
2 puntos

### Prioridad
Should

### Origen
Alcance mínimo P2
'
crear 'HU-37 Sección visible de ayuda y contacto' 'Sprint 3' 2 'historia,frontend,prioridad:baja' '**Como** visitante de la biblioteca **quiero** encontrar rápido cómo contactar a la biblioteca y sus horarios **para** pedir ayuda cuando no encuentre lo que busco.

### Criterios de aceptación
- [ ] Enlace de ayuda visible en todas las páginas.
- [ ] Muestra horarios, teléfono y correo de la biblioteca (datos configurables por el administrador).

### Estimación
2 puntos

### Prioridad
Could

### Origen
Propuesta del equipo de Introducción (contacto directo)
'
crear 'HU-38 Despliegue en un entorno accesible por URL' 'Sprint 3' 3 'tarea-tecnica,devops,epic:entrega,prioridad:alta' '**Como** personal del CLENA **quiero** acceder al sistema desde una URL pública **para** usarlo en la biblioteca y en la demo final.

### Criterios de aceptación
- [ ] Backend, frontend y base de datos desplegados; la URL está en el README.
- [ ] Las variables de entorno se configuran en el proveedor, no en el código.
- [ ] Cada fusión a main despliega (o el proceso de despliegue está documentado).

### Estimación
3 puntos

### Prioridad
Must

### Origen
PDF §6 Calidad
'
crear 'HU-39 Manual de usuario y manual de operación' 'Sprint 3' 3 'tarea-tecnica,docs,epic:entrega,prioridad:alta' '**Como** personal del CLENA **quiero** manuales claros de uso y de operación **para** operar el sistema sin depender del equipo.

### Criterios de aceptación
- [ ] docs/manual-usuario.md con capturas de las tareas del personal.
- [ ] docs/manual-operacion.md con despliegue, respaldo y restauración de la base de datos y variables de entorno.
- [ ] Colección de Postman o Swagger completo.

### Estimación
3 puntos

### Prioridad
Must

### Origen
PDF §8 y §10
'

echo "Listo: $(( 39 )) issues creados."
