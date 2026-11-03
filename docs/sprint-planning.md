# Sprint Planning

Una sección por sprint, con fecha real, enlace a la grabación de Teams e issues/PRs concretos. Las actas sin diligenciar no cuentan como evidencia.

<!-- ## Sprint 1 — Sprint Planning -->

## Sprint 1 — Planning

- **Fecha y hora:** 17/10/2026 · [16:00-17:30]
- **Modalidad:** Discord 
- **Asistentes:** Kesly Rodríguez - PO; Santiago Vengoechea - Fullstack; Luis Robles - Fullstack
- **Facilitadora:** Joshua (Scrum Master)
- **Duración del sprint:** 2026-10-19 → 2026-10-30 (2 semanas) · **Milestone:** [Sprint 1](https://github.com/Jlobo0210/Clena-catalogo-biblioteca/milestone/2)

### Objetivo del sprint

Tener la base del sistema funcionando de punta a punta: `docker-compose up` levanta backend, frontend y PostgreSQL; un usuario puede registrarse e iniciar sesión con JWT según su rol, y el personal del CLENA puede gestionar por API libros, autores, temas y ejemplares con su ubicación física, todo con CI en verde en cada PR.



### Pendientes de Inception que se cierran al inicio del sprint

| Issue | Título | Puntos | Responsable |
|---|---|---|---|
| #1 | HU-01 Validar y priorizar el Product Backlog con el equipo de Introducción | 1 | [PO] |
| #2 | HU-02 Documentar el modelo de dominio y el diagrama ER | 3 | [completar] |
| #3 | HU-03 Documentar la arquitectura y las decisiones técnicas | 2 | [completar] |



### Issues comprometidos

| Issue | Título | Puntos | Responsable | Depende de |
|---|---|---|---|---|
| #5 | HU-05 Estructura del backend NestJS con Clean Architecture | 3 | [completar] | — |
| #6 | HU-06 Estructura del frontend React + TypeScript | 2 | [completar] | — |
| #7 | HU-07 docker-compose levanta backend, frontend y PostgreSQL | 3 | [completar] | #5, #6 |
| #8 | HU-08 CI con GitHub Actions: lint, pruebas y build en cada PR | 3 | [completar] | #5, #6 |
| #9 | HU-09 Base de la API: /api/v1, Swagger, /health, logs y errores uniformes | 3 | [completar] | #5 |
| #10 | HU-10 Migraciones versionadas y datos semilla ficticios | 3 | [completar] | #2, #7 |
| #11 | HU-11 Registro de usuario público con aviso de privacidad | 3 | [completar] | #9, #10 |
| #12 | HU-12 Inicio de sesión con JWT (access y refresh token) | 5 | [completar] | #11 |
| #13 | HU-13 Autorización por roles: administrador, personal del CLENA y público | 3 | [completar] | #12 |
| #14 | HU-14 Gestión de autores | 2 | [completar] | #9, #10 |
| #15 | HU-15 Gestión de temas | 2 | [completar] | #9, #10 |
| #16 | HU-16 Gestión de libros | 5 | [completar] | #14, #15 |
| #17 | HU-17 Gestión de ejemplares con ubicación física | 5 | [completar] | #16 |
| | **Total** | **42** | | |

> Los números de issue suponen que el script creó HU-01 como #1 en adelante. Verificar en GitHub antes de subir el acta.

### Orden de trabajo acordado

1. **Días 1–3, base técnica:** #5, #6, #7, #8 y #9. Nadie empieza funcionalidades hasta que la estructura de carpetas esté fusionada en `main`, para evitar conflictos.
2. **Días 3–7, en paralelo:** autenticación (#11 → #12 → #13) y catálogo (#10 → #14, #15 → #16 → #17).
3. **Días 8–10:** cerrar pruebas unitarias (cobertura ≥ 70 % en dominio y aplicación), Swagger completo y preparar la demo de la Sprint Review.

### Decisiones y acuerdos

- ORM elegido (Prisma), librería de validación, logger, librería de componentes de React
- Estrategia de merge (merge commit)
- Dailies lunes, miércoles y viernes a las [9pm] en Teams, grabadas.
- Cada PR lo revisa una persona distinta de quien lo abrió; rotación de revisores.
- Límite de trabajo en curso: máximo 2 issues en In Progress por persona.

### Si hay que recortar

Si la capacidad del equipo no alcanza para 42 puntos, los primeros candidatos a pasar al Sprint 2 son #15 Gestión de temas (2) y #14 Gestión de autores (2), porque libros y ejemplares son lo que se demuestra en la Review. Autenticación, roles y CI no se recortan: el PDF los exige en el Sprint 1.

### Riesgos e impedimentos identificados

- Dependencia en cadena: si la base técnica (#5–#9) se retrasa, se bloquea todo el sprint.



