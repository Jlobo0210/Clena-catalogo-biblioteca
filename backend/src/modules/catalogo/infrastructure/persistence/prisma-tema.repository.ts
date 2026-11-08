import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { Tema } from '../../domain/entities/tema';
import { TemaRepository } from '../../domain/repositories/tema.repository';
import { TemaMapper } from '../mappers/tema.mapper';

@Injectable()
export class PrismaTemaRepository implements TemaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async guardar(tema: Tema): Promise<void> {
    const data = TemaMapper.toPersistence(tema);
    await this.prisma.tema.upsert({
      where: { id: data.id },
      create: data,
      update: { nombre: data.nombre, slug: data.slug },
    });
  }

  async buscarPorId(id: string): Promise<Tema | null> {
    const row = await this.prisma.tema.findUnique({ where: { id } });
    return row ? TemaMapper.toDomain(row) : null;
  }

  async buscarPorNombre(nombre: string): Promise<Tema | null> {
    const row = await this.prisma.tema.findFirst({
      where: { nombre: { equals: nombre, mode: 'insensitive' } },
    });
    return row ? TemaMapper.toDomain(row) : null;
  }
}
