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

## Pendiente en otras historias

- `/api/v1`, Swagger en `/docs`, `/health`, logs estructurados y filtro global de errores: HU-09.
- Migraciones versionadas (`prisma migrate`) y semillas: HU-10.
- Dockerfile y `docker-compose`: HU-07. CI: HU-08.
