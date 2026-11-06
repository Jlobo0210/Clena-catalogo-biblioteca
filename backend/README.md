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
| `npm run test:e2e` | Pruebas e2e de la API |
| `npm run build` | Compila a `dist/` |

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
