CREATE TABLE "configuracion_biblioteca" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "horarios" VARCHAR(1000) NOT NULL,
    "telefono" VARCHAR(30) NOT NULL,
    "correo" VARCHAR(254) NOT NULL,
    CONSTRAINT "configuracion_biblioteca_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "configuracion_biblioteca_registro_unico" CHECK ("id" = 1)
);
