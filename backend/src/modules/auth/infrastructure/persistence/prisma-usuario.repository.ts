import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { Usuario } from '../../domain/entities/usuario';
import {
  FiltroUsuarios,
  UsuarioRepository,
} from '../../domain/repositories/usuario.repository';
import { UsuarioMapper } from '../mappers/usuario.mapper';

@Injectable()
export class PrismaUsuarioRepository implements UsuarioRepository {
  constructor(private readonly prisma: PrismaService) {}

  async guardar(usuario: Usuario): Promise<void> {
    const data = UsuarioMapper.toPersistence(usuario);
    await this.prisma.usuario.upsert({
      where: { id: usuario.id },
      create: data,
      update: {
        nombre: data.nombre,
        email: data.email,
        passwordHash: data.passwordHash,
        rol: data.rol,
        anonimizadoEn: data.anonimizadoEn,
      },
    });
  }

  async buscarPorId(id: string): Promise<Usuario | null> {
    const row = await this.prisma.usuario.findUnique({ where: { id } });
    return row ? UsuarioMapper.toDomain(row) : null;
  }

  async buscarPorEmail(email: string): Promise<Usuario | null> {
    const row = await this.prisma.usuario.findUnique({ where: { email } });
    return row ? UsuarioMapper.toDomain(row) : null;
  }

  async listar(
    filtro: FiltroUsuarios,
  ): Promise<{ items: Usuario[]; total: number }> {
    const where: Prisma.UsuarioWhereInput = {
      anonimizadoEn: null,
      ...(filtro.rol ? { rol: filtro.rol } : {}),
      ...(filtro.texto
        ? {
            OR: [
              { nombre: { contains: filtro.texto, mode: 'insensitive' } },
              { email: { contains: filtro.texto, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.usuario.findMany({
        where,
        orderBy: { creadoEn: 'desc' },
        skip: (filtro.pagina - 1) * filtro.tamano,
        take: filtro.tamano,
      }),
      this.prisma.usuario.count({ where }),
    ]);
    return { items: rows.map((r) => UsuarioMapper.toDomain(r)), total };
  }

  contarPrestamosSinDevolver(usuarioId: string): Promise<number> {
    return this.prisma.prestamo.count({
      where: { usuarioId, fechaDevolucion: null },
    });
  }

  async guardarAnonimizado(usuario: Usuario): Promise<void> {
    const data = UsuarioMapper.toPersistence(usuario);
    await this.prisma.$transaction([
      this.prisma.usuario.update({
        where: { id: usuario.id },
        data: {
          nombre: data.nombre,
          email: data.email,
          passwordHash: null,
          anonimizadoEn: data.anonimizadoEn,
        },
      }),
      // Las sesiones y las suscripciones también identifican a la persona: se borran.
      this.prisma.refreshToken.deleteMany({ where: { usuarioId: usuario.id } }),
      this.prisma.suscripcionDisponibilidad.deleteMany({
        where: { usuarioId: usuario.id },
      }),
    ]);
  }
}
