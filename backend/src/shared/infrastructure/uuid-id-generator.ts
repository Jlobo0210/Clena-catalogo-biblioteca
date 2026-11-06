import { randomUUID } from 'node:crypto';
import { IdGenerator } from '../domain/id-generator';

export class UuidIdGenerator implements IdGenerator {
  generate(): string {
    return randomUUID();
  }
}
