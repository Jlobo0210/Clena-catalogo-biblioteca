/** DTOs de la capa de aplicación: datos planos que entran y salen de los casos de uso. */
export interface CrearTemaInput {
  nombre: string;
}

export interface TemaOutput {
  id: string;
  nombre: string;
  creadoEn: string;
}
