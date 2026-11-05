# Capa de presentación del catálogo

Aquí van los controladores REST, DTOs de entrada con `class-validator`, guards y pipes.
Un controlador **solo** invoca casos de uso de `application/`; nunca usa Prisma ni repositorios.

Pendiente en este módulo: `TemasController` (HU-15). El prefijo `/api/v1`, la validación y el formato de errores ya son globales (HU-09).
