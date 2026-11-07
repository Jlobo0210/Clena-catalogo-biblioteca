#!/bin/sh
# Aplica las migraciones pendientes y arranca la API.
set -e

if [ -d prisma/migrations ]; then
  echo "Aplicando migraciones de Prisma..."
  npx prisma migrate deploy
else
  echo "Todavía no hay migraciones (llegan con HU-10); se omite prisma migrate deploy."
fi

exec node dist/main
