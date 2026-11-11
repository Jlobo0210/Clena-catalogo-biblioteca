// Pruebas de integración (HU-28): la API completa contra una base PostgreSQL real.
// La base debe tener las migraciones y las semillas: prisma migrate deploy && npm run prisma:seed.
// Crean datos con nombres únicos y borran lo que pueden: usar una base de desarrollo o de prueba,
// nunca una con datos reales.
import { existsSync, readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';

// En local se leen DATABASE_URL y SEED_PASSWORD de backend/.env.
// Las variables ya definidas (las del CI) no se reemplazan.
// (No se usa process.loadEnvFile: Jest le da a cada prueba su propia copia de process.env.)
if (existsSync('.env')) {
  for (const [clave, valor] of Object.entries(
    parseEnv(readFileSync('.env', 'utf8')),
  )) {
    process.env[clave] ??= valor;
  }
}
process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET ??=
  'secreto-solo-para-pruebas-de-integracion-0123';

for (const variable of ['DATABASE_URL', 'SEED_PASSWORD']) {
  if (!process.env[variable]) {
    throw new Error(
      `Falta ${variable}: las pruebas de integración necesitan una base PostgreSQL de prueba con las semillas (ver backend/README.md).`,
    );
  }
}
