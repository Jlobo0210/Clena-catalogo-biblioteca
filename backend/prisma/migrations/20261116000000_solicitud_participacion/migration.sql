CREATE TYPE "TipoParticipacion" AS ENUM ('LIBRO', 'SUGERENCIA', 'QUEJA', 'FELICITACION');
CREATE TYPE "EstadoParticipacion" AS ENUM ('PENDIENTE');
CREATE TABLE "solicitud_participacion" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tipo" "TipoParticipacion" NOT NULL,
    "titulo" VARCHAR(300),
    "autor" VARCHAR(200),
    "mensaje" VARCHAR(3000),
    "nombre" VARCHAR(120),
    "correo" VARCHAR(254),
    "creada_en" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado" "EstadoParticipacion" NOT NULL DEFAULT 'PENDIENTE',
    CONSTRAINT "solicitud_participacion_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "solicitud_participacion_campos_requeridos" CHECK (
      ("tipo" = 'LIBRO' AND length(trim(coalesce("titulo", ''))) > 0 AND length(trim(coalesce("autor", ''))) > 0)
      OR ("tipo" <> 'LIBRO' AND length(trim(coalesce("mensaje", ''))) > 0)
    )
);
