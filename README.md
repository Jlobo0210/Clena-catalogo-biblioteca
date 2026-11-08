# Clena-catalogo-biblioteca

Catálogo bibliográfico accesible para la Biblioteca del CLENA. Backend en NestJS (Clean Architecture) + Prisma, frontend en React y base de datos PostgreSQL.

## Cómo levantar el proyecto con Docker

Requisitos: [Docker Desktop](https://www.docker.com/products/docker-desktop/) (o Docker Engine con Compose v2).

```bash
git clone https://github.com/Jlobo0210/clena-catalogo-biblioteca.git
cd clena-catalogo-biblioteca
cp .env.example .env          # en PowerShell: Copy-Item .env.example .env
# editar .env y completar POSTGRES_USER, POSTGRES_PASSWORD y POSTGRES_DB
docker compose up -d --build
```

Completa también `SEED_PASSWORD`: es la contraseña de los usuarios de demostración que se crean al arrancar.

Las credenciales de la base no tienen valor por defecto para que nunca queden en el repositorio; si faltan, `docker compose` se detiene y dice cuál. El resto de variables son opcionales. Al arrancar, el backend espera a que PostgreSQL esté listo, aplica las migraciones pendientes (`prisma migrate deploy`), carga los datos semilla de demostración (si `SEED_DEMO=true`, el valor por defecto) y luego levanta la API; el frontend se sirve con nginx cuando la API está sana.

| Servicio | URL |
|---|---|
| API | http://localhost:3000/api/v1 |
| Documentación Swagger | http://localhost:3000/docs |
| Estado de la API y la base de datos | http://localhost:3000/health |
| PostgreSQL 16 | `localhost:5432` (usuario, clave y base los de tu `.env`) |
| Frontend | http://localhost:5173 |

Comandos útiles:

```bash
docker compose up -d --build      # en segundo plano
docker compose logs -f backend    # ver los logs de la API
docker compose ps                 # estado de los servicios (healthy = listo)
docker compose down               # detener (los datos se conservan)
docker compose down -v            # detener y BORRAR los datos de la base
```

### Configuración

`.env.example` documenta todas las variables (credenciales de la base, puertos, CORS, nivel de logs y URL de la API para el frontend) y no trae valores sensibles. `.env` es local de cada persona y nunca se sube (está en `.gitignore`). En el despliegue se usan credenciales distintas a las de desarrollo.

Si el puerto 5432 o 3000 ya está ocupado en tu equipo, cambia `DB_PORT` o `BACKEND_PORT` en `.env`.

## Desarrollo sin Docker

- Backend: ver [backend/README.md](backend/README.md) (`npm run start:dev`, pruebas y estructura de capas).
- Frontend: `cd frontend && npm install && npm run dev` (abre http://localhost:5173; la URL de la API se cambia con `VITE_API_BASE_URL` en `frontend/.env`).
