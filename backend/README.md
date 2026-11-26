# Backend · Catálogo bibliográfico accesible (CLENA)

API en **NestJS + TypeScript** con **Clean Architecture**, **Prisma** como ORM y **PostgreSQL**.

## Cómo correrlo

```bash
cd backend
cp .env.example .env      # ajustar DATABASE_URL
npm install               # también genera el cliente de Prisma
npm run start:dev
```

| Comando | Qué hace |
|---|---|
| `npm run lint` | ESLint + Prettier, incluida la **regla de dependencia** entre capas |
| `npm test` | Pruebas unitarias (dominio y casos de uso) |
| `npm run test:cov` | Pruebas con cobertura; falla si dominio + aplicación bajan de 70 % |
| `npm run test:e2e` | Pruebas e2e de la API (repositorios en memoria, sin base de datos) |
| `npm run test:integracion` | Flujos principales contra PostgreSQL real (ver abajo) |
| `npm run build` | Compila a `dist/` |

### Pruebas de integración (HU-28)

`test/integracion/` prueba la API completa, sin fakes, contra una base PostgreSQL con migraciones y semillas: login, búsqueda con errores de escritura, gestión de libros, préstamo y devolución, importación CSV y alertas de devolución (en estas, solo el servidor de correo es falso). El CI las corre en el job **Integración** con un PostgreSQL desechable.

En local usan `DATABASE_URL` y `SEED_PASSWORD` de `backend/.env`:

```bash
docker compose up -d db          # desde la raíz del repo
npx prisma migrate deploy
npm run prisma:seed
npm run test:integracion
```

Crean datos con nombres únicos y borran lo que pueden, así que se pueden repetir; aun así, usa una base de desarrollo o de prueba, nunca una con datos reales.

### Alertas de devolución por correo (HU-29)

Una tarea programada (`@nestjs/schedule`) corre todos los días a las 8:00, hora de Colombia, y envía:

- un **recordatorio** a quien tiene un préstamo que vence en los próximos `ALERTA_DIAS_ANTES` días (por defecto 2), y
- un **aviso de vencimiento** cuando la fecha límite ya pasó.

Cada alerta se envía **una sola vez por préstamo** (regla R14, tabla `alerta_prestamo`): si la tarea corre de nuevo no repite correos, y si un día no corrió, al siguiente envía lo pendiente. Si un envío falla, no se anota y se reintenta en la próxima ejecución. No se envían alertas de préstamos devueltos ni a cuentas anonimizadas.

El envío está detrás del puerto `ServicioCorreo` (`src/shared/domain/correo.ts`), con dos adaptadores en `src/shared/infrastructure/correo/`:

| Configuración | Adaptador | Qué pasa |
|---|---|---|
| Sin `SMTP_HOST` (desarrollo, pruebas) | `CorreoEnRegistro` | No envía nada: anota en el log el asunto y el destinatario enmascarado (`pu***@clena.example`) |
| Con `SMTP_HOST` y `CORREO_REMITENTE` | `SmtpCorreo` (nodemailer) | Envía por SMTP |

La administración puede lanzar el envío sin esperar a la tarea con `POST /api/v1/prestamos/alertas/envios`; repetirlo no duplica correos.

Para ver los correos en local sin enviarlos a nadie, usa [Mailpit](https://mailpit.axllent.org/), un servidor SMTP de prueba:

```bash
docker run -d --rm --name mailpit -p 1025:1025 -p 8025:8025 axllent/mailpit:v1.27
```

Y en `backend/.env`: `SMTP_HOST=localhost`, `SMTP_PORT=1025` y `CORREO_REMITENTE=Biblioteca CLENA <biblioteca@clena.example>`. Los correos aparecen en http://localhost:8025. Con `ALERTAS_HORARIO=* * * * *` la tarea corre cada minuto, útil para probar.

## Capas

```
src/
├── main.ts / app.module.ts        arranque y composición
├── shared/
│   ├── domain/                    errores de dominio, puertos comunes (IdGenerator)
│   └── infrastructure/            PrismaService, UuidIdGenerator
└── modules/<modulo>/              p. ej. catalogo, auth, prestamos
    ├── domain/                    entidades, objetos de valor, reglas, interfaces de repositorio
    ├── application/               casos de uso (uno por acción) y DTOs
    ├── infrastructure/            repositorios con Prisma y mappers Prisma ⇄ dominio
    ├── presentation/              controladores REST, DTOs con class-validator, guards
    └── <modulo>.module.ts         une cada interfaz (token) con su implementación
```

Las dependencias apuntan siempre hacia el dominio:

| Capa | Puede importar | No puede importar |
|---|---|---|
| `domain` | solo `domain` | `@nestjs/*`, `@prisma/*`, `application`, `infrastructure`, `presentation` |
| `application` | `domain` | `@nestjs/*`, `@prisma/*`, `infrastructure`, `presentation` |
| `infrastructure` | `domain`, `application`, Nest, Prisma | `presentation` |
| `presentation` | `application`, `domain`, Nest | `@prisma/*`, `infrastructure` |

ESLint (`no-restricted-imports` en `eslint.config.mjs`) hace cumplir esta tabla: si alguien importa `@nestjs/common` o Prisma desde `domain/`, `npm run lint` falla y el CI no deja fusionar.

## Ejemplo de referencia: `Tema`

El módulo `catalogo` trae un corte vertical mínimo para copiar el patrón:

1. `domain/entities/tema.ts`: entidad con sus reglas (nombre obligatorio, máx. 120).
2. `domain/repositories/tema.repository.ts`: interfaz `TemaRepository` + token `TEMA_REPOSITORY`.
3. `application/use-cases/crear-tema.use-case.ts`: clase sin decoradores que recibe la interfaz por constructor.
4. `infrastructure/persistence/prisma-tema.repository.ts` + `infrastructure/mappers/tema.mapper.ts`: implementación con Prisma; el modelo de Prisma nunca sale de aquí.
5. `catalogo.module.ts`: `{ provide: TEMA_REPOSITORY, useClass: PrismaTemaRepository }` y el caso de uso con `useFactory`.

Para una entidad nueva (Autor, Libro, Ejemplar…) se repiten los mismos cinco pasos. Los casos de uso se prueban con un repositorio en memoria, sin base de datos (ver `crear-tema.use-case.spec.ts`).

## Base de la API (HU-09)

| Qué | Dónde |
|---|---|
| Rutas de negocio | `/api/v1/...` (prefijo global en `src/app.setup.ts`) |
| Swagger | `/docs` (JSON en `/docs-json`) |
| Salud | `GET /health` → `200` si PostgreSQL responde, `503` si no |
| Logs | JSON con Pino (`nestjs-pino`); nivel con `LOG_LEVEL`; cada petición lleva `x-request-id` |
| Errores | `AllExceptionsFilter` devuelve siempre el mismo formato |
| Validación | `ValidationPipe` global con `whitelist`, `forbidNonWhitelisted` y `transform` |

Formato de error (esquema `ErrorResponse` en Swagger):

```json
{
  "statusCode": 400,
  "error": "VALIDATION_ERROR",
  "message": "Los datos enviados no son válidos",
  "details": ["nombre should not be empty"],
  "path": "/api/v1/temas",
  "timestamp": "2026-11-03T23:30:00.000Z",
  "requestId": "6cf3feb0-..."
}
```

Desde el dominio basta con lanzar `ValidationError`, `NotFoundError` o `ConflictError` (`src/shared/domain/domain-error.ts`); el filtro los convierte en 400, 404 y 409. Los errores inesperados salen como `500 INTERNAL_ERROR` sin detalles internos, y el detalle queda en el log con el mismo `requestId`.

Para los DTOs de entrada de cada controlador se usa `class-validator`; el plugin de Swagger (`nest-cli.json`) los documenta solo.

## Pendiente en otras historias

- Migraciones versionadas (`prisma migrate`) y semillas: HU-10.
- Docker: `backend/Dockerfile` aplica las migraciones al arrancar; ver el README de la raíz (HU-07).
