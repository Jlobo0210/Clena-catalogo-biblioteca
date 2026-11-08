-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ADMINISTRADOR', 'PERSONAL', 'PUBLICO');

-- CreateEnum
CREATE TYPE "EstadoEjemplar" AS ENUM ('DISPONIBLE', 'PRESTADO', 'EN_REPARACION', 'PERDIDO');

-- CreateEnum
CREATE TYPE "TipoMaterial" AS ENUM ('LIBRO', 'REVISTA', 'TESIS', 'TRABAJO_DE_GRADO', 'MATERIAL_AUDIOVISUAL', 'OTRO');

-- CreateEnum
CREATE TYPE "Formato" AS ENUM ('FISICO', 'DIGITAL', 'FISICO_Y_DIGITAL');

-- CreateEnum
CREATE TYPE "TipoAlerta" AS ENUM ('RECORDATORIO', 'VENCIMIENTO');

-- CreateTable
CREATE TABLE "usuario" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nombre" VARCHAR(120) NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "password_hash" TEXT,
    "rol" "Rol" NOT NULL DEFAULT 'PUBLICO',
    "consentimiento_privacidad_en" TIMESTAMPTZ NOT NULL,
    "version_aviso_privacidad" VARCHAR(20) NOT NULL,
    "anonimizado_en" TIMESTAMPTZ,
    "creado_en" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_token" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "usuario_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expira_en" TIMESTAMPTZ NOT NULL,
    "revocado_en" TIMESTAMPTZ,
    "creado_en" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "autor" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nombre" VARCHAR(200) NOT NULL,
    "creado_en" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "autor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tema" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nombre" VARCHAR(120) NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "descripcion" TEXT,
    "creado_en" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "tema_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "libro" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "titulo" VARCHAR(300) NOT NULL,
    "anio_publicacion" SMALLINT,
    "idioma" CHAR(2) NOT NULL,
    "isbn" VARCHAR(13),
    "tipo_material" "TipoMaterial" NOT NULL DEFAULT 'LIBRO',
    "formato" "Formato" NOT NULL DEFAULT 'FISICO',
    "enlace_digital" VARCHAR(500),
    "creado_en" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "libro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "libro_autor" (
    "libro_id" UUID NOT NULL,
    "autor_id" UUID NOT NULL,
    "orden" SMALLINT NOT NULL DEFAULT 1,

    CONSTRAINT "libro_autor_pkey" PRIMARY KEY ("libro_id","autor_id")
);

-- CreateTable
CREATE TABLE "libro_tema" (
    "libro_id" UUID NOT NULL,
    "tema_id" UUID NOT NULL,

    CONSTRAINT "libro_tema_pkey" PRIMARY KEY ("libro_id","tema_id")
);

-- CreateTable
CREATE TABLE "ubicacion" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sala" VARCHAR(60) NOT NULL,
    "seccion" VARCHAR(60) NOT NULL,
    "estante" VARCHAR(30) NOT NULL,
    "codigo" VARCHAR(30) NOT NULL,
    "creado_en" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "ubicacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ejemplar" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "libro_id" UUID NOT NULL,
    "ubicacion_id" UUID NOT NULL,
    "codigo_inventario" VARCHAR(40) NOT NULL,
    "estado" "EstadoEjemplar" NOT NULL DEFAULT 'DISPONIBLE',
    "observaciones" TEXT,
    "creado_en" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "ejemplar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prestamo" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ejemplar_id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "registrado_por_id" UUID NOT NULL,
    "fecha_prestamo" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_limite" DATE NOT NULL,
    "fecha_devolucion" TIMESTAMPTZ,
    "creado_en" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "prestamo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerta_prestamo" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "prestamo_id" UUID NOT NULL,
    "tipo" "TipoAlerta" NOT NULL,
    "enviada_en" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alerta_prestamo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suscripcion_disponibilidad" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "usuario_id" UUID NOT NULL,
    "libro_id" UUID NOT NULL,
    "notificada_en" TIMESTAMPTZ,
    "cancelada_en" TIMESTAMPTZ,
    "creado_en" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "suscripcion_disponibilidad_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuario_email_key" ON "usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_token_token_hash_key" ON "refresh_token"("token_hash");

-- CreateIndex
CREATE INDEX "refresh_token_usuario_id_idx" ON "refresh_token"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "tema_nombre_key" ON "tema"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "tema_slug_key" ON "tema"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "libro_isbn_key" ON "libro"("isbn");

-- CreateIndex
CREATE INDEX "libro_idioma_idx" ON "libro"("idioma");

-- CreateIndex
CREATE INDEX "libro_tipo_material_idx" ON "libro"("tipo_material");

-- CreateIndex
CREATE INDEX "libro_anio_publicacion_idx" ON "libro"("anio_publicacion");

-- CreateIndex
CREATE INDEX "libro_autor_autor_id_idx" ON "libro_autor"("autor_id");

-- CreateIndex
CREATE INDEX "libro_tema_tema_id_idx" ON "libro_tema"("tema_id");

-- CreateIndex
CREATE UNIQUE INDEX "ubicacion_codigo_key" ON "ubicacion"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "ubicacion_sala_seccion_estante_key" ON "ubicacion"("sala", "seccion", "estante");

-- CreateIndex
CREATE UNIQUE INDEX "ejemplar_codigo_inventario_key" ON "ejemplar"("codigo_inventario");

-- CreateIndex
CREATE INDEX "ejemplar_libro_id_estado_idx" ON "ejemplar"("libro_id", "estado");

-- CreateIndex
CREATE INDEX "ejemplar_ubicacion_id_idx" ON "ejemplar"("ubicacion_id");

-- CreateIndex
CREATE INDEX "prestamo_usuario_id_idx" ON "prestamo"("usuario_id");

-- CreateIndex
CREATE INDEX "prestamo_ejemplar_id_idx" ON "prestamo"("ejemplar_id");

-- CreateIndex
CREATE UNIQUE INDEX "alerta_prestamo_prestamo_id_tipo_key" ON "alerta_prestamo"("prestamo_id", "tipo");

-- CreateIndex
CREATE INDEX "suscripcion_disponibilidad_libro_id_idx" ON "suscripcion_disponibilidad"("libro_id");

-- AddForeignKey
ALTER TABLE "refresh_token" ADD CONSTRAINT "refresh_token_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "libro_autor" ADD CONSTRAINT "libro_autor_libro_id_fkey" FOREIGN KEY ("libro_id") REFERENCES "libro"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "libro_autor" ADD CONSTRAINT "libro_autor_autor_id_fkey" FOREIGN KEY ("autor_id") REFERENCES "autor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "libro_tema" ADD CONSTRAINT "libro_tema_libro_id_fkey" FOREIGN KEY ("libro_id") REFERENCES "libro"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "libro_tema" ADD CONSTRAINT "libro_tema_tema_id_fkey" FOREIGN KEY ("tema_id") REFERENCES "tema"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ejemplar" ADD CONSTRAINT "ejemplar_libro_id_fkey" FOREIGN KEY ("libro_id") REFERENCES "libro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ejemplar" ADD CONSTRAINT "ejemplar_ubicacion_id_fkey" FOREIGN KEY ("ubicacion_id") REFERENCES "ubicacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prestamo" ADD CONSTRAINT "prestamo_ejemplar_id_fkey" FOREIGN KEY ("ejemplar_id") REFERENCES "ejemplar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prestamo" ADD CONSTRAINT "prestamo_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prestamo" ADD CONSTRAINT "prestamo_registrado_por_id_fkey" FOREIGN KEY ("registrado_por_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerta_prestamo" ADD CONSTRAINT "alerta_prestamo_prestamo_id_fkey" FOREIGN KEY ("prestamo_id") REFERENCES "prestamo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suscripcion_disponibilidad" ADD CONSTRAINT "suscripcion_disponibilidad_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suscripcion_disponibilidad" ADD CONSTRAINT "suscripcion_disponibilidad_libro_id_fkey" FOREIGN KEY ("libro_id") REFERENCES "libro"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- unaccent() no es IMMUTABLE y no se puede usar directamente en un índice.
CREATE OR REPLACE FUNCTION f_unaccent(text) RETURNS text
  LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT
  AS $$ SELECT public.unaccent('public.unaccent'::regdictionary, $1) $$;

-- Búsqueda tolerante a errores y sin tildes (HU-20, HU-21)
CREATE INDEX "libro_titulo_trgm_idx" ON "libro" USING gin (f_unaccent(lower("titulo")) gin_trgm_ops);
CREATE INDEX "autor_nombre_trgm_idx" ON "autor" USING gin (f_unaccent(lower("nombre")) gin_trgm_ops);
CREATE INDEX "tema_nombre_trgm_idx" ON "tema" USING gin (f_unaccent(lower("nombre")) gin_trgm_ops);

-- R7: un solo préstamo activo por ejemplar
CREATE UNIQUE INDEX "prestamo_ejemplar_activo_uq" ON "prestamo" ("ejemplar_id") WHERE "fecha_devolucion" IS NULL;
-- Préstamos activos por fecha límite (alertas y vencidos)
CREATE INDEX "prestamo_activo_fecha_limite_idx" ON "prestamo" ("fecha_limite") WHERE "fecha_devolucion" IS NULL;
-- R13: una suscripción activa por usuario y libro
CREATE UNIQUE INDEX "suscripcion_activa_uq" ON "suscripcion_disponibilidad" ("usuario_id", "libro_id")
  WHERE "notificada_en" IS NULL AND "cancelada_en" IS NULL;
-- R3: un libro digital requiere enlace
ALTER TABLE "libro" ADD CONSTRAINT "libro_enlace_digital_ck"
  CHECK ("formato" = 'FISICO' OR "enlace_digital" IS NOT NULL);