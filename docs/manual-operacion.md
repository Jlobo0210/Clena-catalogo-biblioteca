# Manual de operación: Catálogo CLENA

> **Versión:** Sprint 3  
> **Audiencia:** Equipo técnico responsable del despliegue y mantenimiento
> **Repositorio:** https://github.com/Jlobo0210/clena-catalogo-biblioteca

---

## Tabla de contenidos

1. [Requisitos previos](#1-requisitos-previos)
2. [Variables de entorno](#2-variables-de-entorno)
3. [Despliegue con Docker Compose](#3-despliegue-con-docker-compose)
4. [URL del sistema desplegado](#4-url-del-sistema-desplegado)
5. [Respaldo de la base de datos](#5-respaldo-de-la-base-de-datos)
6. [Restauración de la base de datos](#6-restauración-de-la-base-de-datos)
7. [Actualización del sistema](#7-actualización-del-sistema)
8. [Verificación del estado del sistema](#8-verificación-del-estado-del-sistema)
9. [Logs](#9-logs)
10. [API: Swagger y Postman](#10-api-swagger-y-postman)

---

## 1. Requisitos previos

| Herramienta | Versión mínima | Notas |
|---|---|---|
| Docker Engine | 24.x | o Docker Desktop 4.x |
| Docker Compose | v2.x | incluido en Docker Desktop |
| Git | cualquiera | para clonar el repositorio |

No se requiere Node.js ni PostgreSQL instalados en el servidor, Docker los provee.

---

## 2. Variables de entorno

Copiar `.env.example` a `.env` y completar todos los campos marcados como obligatorios antes de levantar el sistema.

```bash
cp .env.example .env
# En PowerShell: Copy-Item .env.example .env
```

### Variables obligatorias

| Variable | Descripción | Ejemplo |
|---|---|---|
| `POSTGRES_USER` | Usuario de la base de datos | `clena_user` |
| `POSTGRES_PASSWORD` | Contraseña de la base de datos | *(cadena segura)* |
| `POSTGRES_DB` | Nombre de la base de datos | `clena_catalogo` |
| `JWT_ACCESS_SECRET` | Secreto para firmar tokens JWT | *(cadena aleatoria ≥ 32 caracteres)* |
| `SEED_PASSWORD` | Contraseña de los usuarios de demostración | *(mín. 8 caracteres, letras y números)* |

> El archivo `.env` no está subido al repositorio, está en `.gitignore`. Se usan credenciales diferentes en producción y desarrollo.

### Variables opcionales: Backend

| Variable | Valor por defecto | Descripción |
|---|---|---|
| `PORT` | `3000` | Puerto interno del backend |
| `BACKEND_PORT` | `3000` | Puerto expuesto en el host |
| `DB_PORT` | `5432` | Puerto de PostgreSQL expuesto en el host |
| `CORS_ORIGIN` | `http://localhost:5173` | Orígenes permitidos (separados por coma) |
| `LOG_LEVEL` | `info` | `trace`, `debug`, `info`, `warn`, `error`, `silent` |
| `JWT_ACCESS_TTL_SECONDS` | `900` | Tiempo de vida del access token (segundos) |
| `JWT_REFRESH_TTL_DAYS` | `7` | Tiempo de vida del refresh token (días) |
| `PRESTAMO_DIAS` | `15` | Plazo del préstamo en días |
| `PRESTAMO_MAX_ACTIVOS` | `3` | Máximo de préstamos simultáneos por usuario |
| `SEED_DEMO` | `true` | Cargar datos de demostración al arrancar |

### Variables opcionales: Alertas de devolución por correo (HU-29)

| Variable | Valor por defecto | Descripción |
|---|---|---|
| `ALERTA_DIAS_ANTES` | `2` | Días de anticipación para enviar el recordatorio (1–30) |
| `ALERTAS_HORARIO` | `0 8 * * *` | Horario en formato cron, hora de Colombia |
| `ALERTAS_ACTIVAS` | `true` | `false` desactiva la tarea programada |
| `SMTP_HOST` | `sandbox.smtp.mailtrap.io` | Host SMTP. Sin este valor los correos solo se registran en el log |
| `SMTP_PORT` | `587` | `587` (STARTTLS) o `465` (TLS directo) |
| `SMTP_SECURE` | `false` | `true` solo con el puerto 465 |
| `SMTP_USER` | Usuario privado | Usuario SMTP |
| `SMTP_PASS` | Contraseña privada | Contraseña SMTP |
| `CORREO_REMITENTE` | `Biblioteca CLENA <noreply@clena.example>` | Obligatorio si hay `SMTP_HOST`.

### Variables opcionales: Frontend

| Variable | Valor por defecto | Descripción |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:3000/api/v1` | URL base de la API desde el navegador |
| `FRONTEND_PORT` | `5173` | Puerto del frontend expuesto en el host |

---

## 3. Despliegue con Docker Compose

### Primera vez

```bash
git clone https://github.com/Jlobo0210/clena-catalogo-biblioteca.git
cd clena-catalogo-biblioteca
cp .env.example .env
# Editar .env y completar los campos obligatorios
docker compose up -d --build
```

Al arrancar, el backend:
1. Espera a que PostgreSQL esté listo (healthcheck).
2. Aplica las migraciones pendientes (`prisma migrate deploy`).
3. Carga los datos de demostración si `SEED_DEMO=true`.
4. Levanta la API en el puerto configurado.

El frontend se sirve con **nginx** cuando la API responde sano.

### Comandos de operación habituales

```bash
# Levantar en segundo plano
docker compose up -d --build

# Ver estado de los servicios (healthy = listo)
docker compose ps

# Ver logs de la API en tiempo real
docker compose logs -f backend

# Ver logs del frontend
docker compose logs -f frontend

# Detener (conserva los datos)
docker compose down

# Detener y eliminar la base de datos
docker compose down -v
```

### Puertos por defecto

| Servicio | URL local |
|---|---|
| Frontend | http://localhost:5173 |
| API REST | http://localhost:3000/api/v1 |
| Swagger (documentación API) | http://localhost:3000/docs |
| Health check | http://localhost:3000/health |
| PostgreSQL | localhost:5432 |

> Si algún puerto está ocupado, cambiar `DB_PORT`, `BACKEND_PORT` o `FRONTEND_PORT` en `.env`.

---

## 4. URL del sistema desplegado

| Recurso | URL |
|---|---|
| Aplicación | *(por confirmar)* |
| API | *(por confirmar)*/api/v1 |
| Swagger | *(por confirmar)*/docs |

---

## 5. Respaldo de la base de datos

El volumen `db-data` de Docker contiene todos los datos. El respaldo más confiable es mediante `pg_dump` ejecutado dentro del contenedor.

### Respaldo manual

> Sustituir `$POSTGRES_USER` y `$POSTGRES_DB` por los valores reales del `.env`, o exportarlos primero con `source .env`.

```bash
# Nombre del archivo con fecha
docker compose exec db pg_dump \
  -U $POSTGRES_USER \
  -d $POSTGRES_DB \
  -F c \
  -f /tmp/backup_$(date +%Y%m%d_%H%M%S).dump

# Copiar el dump al host
docker compose cp db:/tmp/backup_$(date +%Y%m%d).dump ./backups/
```

O en un solo comando:

```bash
docker compose exec -T db pg_dump \
  -U "$POSTGRES_USER" "$POSTGRES_DB" \
  > "backups/clena_$(date +%Y%m%d_%H%M%S).sql"
```

### Respaldo automático (cron en el servidor)

Agregar al crontab del servidor una línea como la siguiente para un respaldo diario a las 2:00 a.m.:

```cron
0 2 * * * /usr/bin/docker compose -f /ruta/al/proyecto/docker-compose.yml exec -T db pg_dump -U clena_user clena_catalogo > /ruta/backups/clena_$(date +\%Y\%m\%d).sql
```

Mantener al menos **7 días** de respaldos y verificar periódicamente que los archivos no estén vacíos.

---

## 6. Restauración de la base de datos

> La restauración **sobreescribe** los datos actuales. Realizarla solo con el sistema detenido o en una ventana de mantenimiento.

### Desde un archivo `.sql`

```bash
# 1. Detener el backend y el frontend (mantener la BD activa)
docker compose stop backend frontend

# 2. Restaurar
cat backups/clena_20240101_020000.sql | \
  docker compose exec -T db psql -U "$POSTGRES_USER" "$POSTGRES_DB"

# 3. Volver a levantar
docker compose start backend frontend
```

### Desde un archivo `.dump` (formato custom de pg_dump -F c)

```bash
docker compose stop backend frontend

docker compose exec -T db pg_restore \
  -U "$POSTGRES_USER" \
  -d "$POSTGRES_DB" \
  --clean \
  < backups/backup_20240101.dump

docker compose start backend frontend
```

### Restauración completa desde cero

Útil cuando se migra a un nuevo servidor o se reconstruye el entorno:

```bash
# 1. Eliminar el volumen existente
docker compose down -v

# 2. Levantar solo la base de datos
docker compose up -d db

# 3. Esperar a que esté sana
docker compose ps   # db debe mostrar (healthy)

# 4. Restaurar el dump
cat backups/clena_20240101.sql | \
  docker compose exec -T db psql -U "$POSTGRES_USER" "$POSTGRES_DB"

# 5. Levantar el resto del sistema
docker compose up -d backend frontend
```

---

## 7. Actualización del sistema

```bash
# 1. Obtener los últimos cambios
git pull origin main

# 2. Reconstruir y reiniciar
docker compose up -d --build
```

Las migraciones de base de datos se aplican automáticamente al arrancar el backend (`prisma migrate deploy`).

---

## 8. Verificación del estado del sistema

El endpoint de salud informa el estado del backend y de la conexión a la base de datos:

```bash
curl http://localhost:3000/health
```

Respuesta esperada (sistema sano):

```json
{
  "status": "ok",
  "info": {
    "database": { "status": "up" }
  }
}
```

Si `database.status` es `"down"`, revisar que el contenedor `db` esté corriendo y sano (`docker compose ps`).

---

## 9. Logs

```bash
# Logs de la API (en tiempo real)
docker compose logs -f backend

# Logs del frontend (nginx)
docker compose logs -f frontend

# Logs de la base de datos
docker compose logs -f db

# Últimas 100 líneas del backend
docker compose logs --tail=100 backend
```

El nivel de detalle de los logs del backend se controla con `LOG_LEVEL` en `.env` (`info` por defecto; usar `debug` para más detalle en desarrollo).

---

## 10. API: Swagger y Postman

### Swagger

La documentación interactiva de la API está disponible mientras el sistema esté corriendo:

- **Local:** http://localhost:3000/docs  
- **Producción:** *(URL base)*/docs

Permite explorar todos los endpoints, ver los esquemas de request/response y ejecutar peticiones directamente desde el navegador. Los endpoints protegidos requieren autenticar primero con `POST /api/v1/auth/login` y pegar el `accessToken` en el botón **Authorize** de Swagger.

### Resumen de endpoints

**Base URL:** `/api/v1`

| Método | Ruta | Descripción | Autenticación |
|---|---|---|---|
| GET | `/health` | Estado del sistema y la BD | No |
| POST | `/auth/registro` | Crear cuenta de usuario | No |
| POST | `/auth/login` | Iniciar sesión | No |
| POST | `/auth/refresh` | Renovar access token | Refresh token |
| POST | `/auth/logout` | Cerrar sesión | Sí |
| GET | `/auth/me` | Perfil del usuario autenticado | Sí |
| DELETE | `/auth/cuenta` | Eliminar propia cuenta | Sí |
| GET | `/auth/aviso-privacidad` | Aviso de privacidad | No |
| GET | `/libros` | Listar libros | No |
| GET | `/libros/buscar` | Búsqueda por título/autor/ISBN | No |
| GET | `/libros/:id` | Detalle de un libro | No |
| POST | `/libros` | Crear libro | Personal/Admin |
| PATCH | `/libros/:id` | Editar libro | Personal/Admin |
| DELETE | `/libros/:id` | Eliminar libro | Personal/Admin |
| GET | `/libros/:libroId/ejemplares` | Ejemplares de un libro | No |
| POST | `/libros/:libroId/ejemplares` | Agregar ejemplar | Personal/Admin |
| PATCH | `/libros/:libroId/ejemplares/:id` | Editar ejemplar | Personal/Admin |
| DELETE | `/libros/:libroId/ejemplares/:id` | Eliminar ejemplar | Personal/Admin |
| POST | `/libros/:libroId/suscripcion` | Activar alerta de disponibilidad | Sí |
| DELETE | `/libros/:libroId/suscripcion/:id` | Cancelar alerta | Sí |
| GET | `/autores` | Listar autores | No |
| POST | `/autores` | Crear autor | Personal/Admin |
| PATCH | `/autores/:id` | Editar autor | Personal/Admin |
| DELETE | `/autores/:id` | Eliminar autor | Personal/Admin |
| GET | `/temas` | Listar temas | No |
| POST | `/temas` | Crear tema | Personal/Admin |
| PATCH | `/temas/:id` | Editar tema | Personal/Admin |
| DELETE | `/temas/:id` | Eliminar tema | Personal/Admin |
| GET | `/ubicaciones` | Listar ubicaciones | No |
| POST | `/ubicaciones` | Crear ubicación | Personal/Admin |
| GET | `/importaciones/plantilla` | Descargar plantilla Excel | Personal/Admin |
| POST | `/importaciones/libros` | Importar libros desde Excel | Personal/Admin |
| POST | `/prestamos` | Registrar préstamo | Personal/Admin |
| POST | `/prestamos/:id/devolucion` | Registrar devolución | Personal/Admin |
| GET | `/prestamos` | Listar préstamos (todos) | Personal/Admin |
| GET | `/prestamos/mios` | Préstamos del usuario autenticado | Sí |
| GET | `/prestamos/resumen` | Resumen de préstamos activos | Personal/Admin |
| GET | `/prestamos/:id` | Detalle de un préstamo | Personal/Admin |
| POST | `/prestamos/alertas/envios` | Disparar envío de alertas de devolución | Personal/Admin |
| GET | `/usuarios` | Listar usuarios | Admin |
| PATCH | `/usuarios/:id/rol` | Cambiar rol de un usuario | Admin |
| GET | `/configuracion-biblioteca` | Leer configuración de la biblioteca | No |
| PUT | `/configuracion-biblioteca` | Actualizar configuración | Admin |
| POST | `/solicitudes-participacion` | Enviar solicitud de participación | No |

### Colección Postman

> Para importar en Postman, usar la URL del Swagger en formato OpenAPI:
> `http://localhost:3000/docs-json`
>
> Pasos:
> 1. Abrir Postman e ir a **Import**.
> 2. Seleccionar **Link** e ingresar `http://localhost:3000/docs-json`.
> 3. Hacer clic en **Import**.
> 4. Se genera automáticamente una colección con todos los endpoints documentados.
