import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { RefreshToken } from '../../domain/entities/refresh-token';
import { RefreshTokenRepository } from '../../domain/repositories/refresh-token.repository';

@Injectable()
export class PrismaRefreshTokenRepository implements RefreshTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async guardar(t: RefreshToken): Promise<void> {
    await this.prisma.refreshToken.create({
      data: {
        id: t.id,
        usuarioId: t.usuarioId,
        tokenHash: t.tokenHash,
        expiraEn: t.expiraEn,
        revocadoEn: t.revocadoEn,
      },
    });
  }

  async buscarPorHash(tokenHash: string): Promise<RefreshToken | null> {
    const row = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });
    return row
      ? {
          id: row.id,
          usuarioId: row.usuarioId,
          tokenHash: row.tokenHash,
          expiraEn: row.expiraEn,
          revocadoEn: row.revocadoEn,
        }
      : null;
  }

  async revocar(id: string, cuando: Date): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { id, revocadoEn: null },
      data: { revocadoEn: cuando },
    });
  }

  async revocarTodosDe(usuarioId: string, cuando: Date): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { usuarioId, revocadoEn: null },
      data: { revocadoEn: cuando },
    });
  }
}
