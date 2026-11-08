# Acta — Reunión de Inception con el equipo de Introducción



- **Proyecto:** P2 — Catálogo bibliográfico accesible (Biblioteca del CLENA)
- **Fecha:** 2026-10-16 · **Hora:** 7pm · **Modalidad:** Teams
- **Grabación (Teams):** [https://uninorte.sharepoint.com/:v:/s/IsisClenacopia/IQAYXSrt4Lk0RrZNlNq3RgfnAdHqvlxiAS-uE2QMvymxW6s?e=2Ohslx] 
- **Tipo de reunión:** Inception — recepción del contexto del equipo de Introducción (Hito 1)
- **Facilitador:** Joshua Lobo (Scrum Master)
- **Equipo de Backend asistente:** Kesly Rodriguez, Santiago Vengoechea, Luis Robles
- **Equipo de Introducción asistente:** grupo G8 - Danna De la Hoz Orduz, Daniel Andrade Cabarcas, Valentina Alfonso Santos, Karvin García Polo, Jorge Quintero Vargas
- **Con copia a:** djromero@uninorte.edu.co

## Agenda

1. Presentación de los equipos y roles.
2. Exposición del equipo de Introducción sobre la visita a la Biblioteca del CLENA (26 de septiembre de 2026).
3. Entrega de la documentación y evidencias de la visita.
4. Preguntas del equipo de Backend.
5. Siguientes pasos.

## Información recibida

| Documento | Contenido |
|---|---|
| `observaciones.md` | Observación del sistema de consulta de la biblioteca: funciones repartidas en formularios y menús, búsqueda temática poco diferenciada de la general, ayuda y contacto poco visibles, interfaz desactualizada. Usuarios afectados: estudiantes, docentes, investigadores, personal administrativo y de soporte. |
| `problemas-identificados.md` | Siete problemas: organización poco clara de funciones, búsqueda difícil, tipos de búsqueda no diferenciados, baja visibilidad de la ayuda, exceso de información, interfaz poco intuitiva para usuarios nuevos y apariencia desactualizada. |
| `problema-seleccionado.md` | Problema principal: organización poco clara de la interfaz de consulta. Propone tres áreas: búsqueda general (palabra clave, autor, título, tipo de material, año, idioma, área temática), búsqueda temática por categorías y contacto directo (chat, mensajes, horarios). |
| `propuesta-solucion.md` | Propuesta «CLENA+: Plataforma de búsqueda bibliográfica»: objetivos, alcance (rediseño de interfaz, prototipo, pruebas de usabilidad), exclusiones (no modificar bases de datos ni sistemas internos) y criterios de evaluación. |
| Fotos y videos de la visita |  |

## Puntos tratados

Se explicó de forma general los problemas identificados, y a su vez las mejoras propuestas.

## Análisis de la documentación (para validar con el equipo de Introducción)

Al cruzar la documentación recibida con el alcance mínimo de P2 del PDF del curso:

| Tema | Propuesta del equipo de Introducción | Alcance mínimo P2 (PDF) | Cómo queda en el backlog |
|---|---|---|---|
| Búsqueda | Campos separados y botones Buscar/Limpiar | Búsqueda simple por título, autor o tema, con filtros y tolerancia a errores | Un solo campo + filtros visibles + botones Buscar/Limpiar (HU-20 a HU-24) |
| Búsqueda temática | Sección independiente por categorías | Búsqueda por tema | Exploración por categorías (HU-35, prioridad media) |
| Ayuda y contacto | Chat con bibliotecario, mensajes, horarios | No incluido | Sección de ayuda visible (HU-37, prioridad baja); chat fuera de alcance |
| Ubicación y disponibilidad | No lo menciona | Sala, sección, estante y disponibilidad física/digital | HU-17 y HU-23 |
| Gestión del catálogo e importación CSV | No contempla modificar datos internos | Obligatorio | HU-14 a HU-17, HU-19, HU-25 |
| QR y tutorial guiado | No lo menciona | Obligatorio | HU-31 y HU-32 |
| Préstamos y alertas | No lo menciona (lo propuso G7) | Obligatorio | HU-26, HU-27, HU-29, HU-30, HU-36 |

Conclusión: la propuesta del equipo de Introducción se centra en el rediseño de la interfaz; el proyecto de Backend debe cubrir además el catálogo administrable, la búsqueda tolerante a errores, la ubicación física, el QR, el tutorial y los préstamos con alertas. Sus ideas de interfaz se incorporan como criterios de aceptación del frontend.

Preguntas pendientes para el equipo de Introducción o el CLENA:
1. ¿Cómo se organiza físicamente la biblioteca (salas, secciones, estantes) y qué códigos usan?
2. ¿El CLENA puede compartir una muestra de su catálogo para la importación CSV? 
3. ¿Cuántos días dura un préstamo y quién lo registra?
4. ¿Qué categorías temáticas usa la biblioteca? (La propuesta lista Arquitectura, Bases de datos, Redes, Programación, etc.)
5. ¿Qué perfil de visitante predomina (adultos mayores, estudiantes) para priorizar accesibilidad?

## Decisiones

| # | Decisión |
|---|---|
| 1 | Joshua asume el rol de Scrum Master del equipo de Backend. |
| 2 | Product Owner: Kesly Rodríguez. Development Team: Santiago Vengoechea, Luis Robles. |
| 3 | Se organizará el trabajo con GitHub Projects (Backlog, To Do, In Progress, In Review, Done), milestones por sprint y GitHub Flow con `main` protegida. |


## Compromisos

| Compromiso | Responsable | Fecha límite | Issue |
|---|---|---|---|
| Crear el GitHub Project, proteger `main` y cargar el Product Backlog | Joshua | 17/10/2026 | HU-04 |
| Revisar el backlog inicial  | Kesly | 19/10/2026 | HU-01 |
| Documentar modelo de dominio y diagrama ER en `docs/` | Santiago | 19/10/2026 | HU-02 |
| Documentar la arquitectura en `docs/arquitectura.md` | Luis | 19/10/2026 | HU-03 |
| Enviar fotos y videos de la visita | Equipo de Introducción | 16/10/2026 | — |




