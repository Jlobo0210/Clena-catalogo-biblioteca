/** Puerto para generar identificadores sin depender de una librería concreta. */
export interface IdGenerator {
  generate(): string;
}

export const ID_GENERATOR = Symbol('ID_GENERATOR');
