#!/bin/sh
# Aplica las migraciones pendientes, carga los datos de demostración y arranca la API.
set -e

echo "Aplicando migraciones de Prisma..."
npx prisma migrate deploy

if [ "${SEED_DEMO:-false}" = "true" ]; then
  echo "Cargando datos semilla de demostración..."
  node dist/seed/seed.js
fi

exec node dist/main
