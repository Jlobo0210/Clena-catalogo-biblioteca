import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'node:crypto';
import {
  AccessTokenPayload,
  TokenService,
} from '../../domain/services/token-service';
import { esRol } from '../../domain/value-objects/rol';

/**
 * Access token: JWT HS256 firmado con JWT_ACCESS_SECRET, vida corta (JWT_ACCESS_TTL_SECONDS, 900 por defecto).
 * Refresh token: 48 bytes aleatorios (no es un JWT); en la base solo se guarda su SHA-256.
 */
@Injectable()
export class JwtTokenService implements TokenService {
  readonly accessTtlSegundos: number;
  readonly refreshTtlDias: number;

  constructor(
    private readonly jwt: JwtService,
    config: ConfigService,
  ) {
    this.accessTtlSegundos = Number(
      config.get<string>('JWT_ACCESS_TTL_SECONDS') || 900,
    );
    this.refreshTtlDias = Number(
      config.get<string>('JWT_REFRESH_TTL_DAYS') || 7,
    );
  }

  firmarAccess(payload: AccessTokenPayload): Promise<string> {
    return this.jwt.signAsync(
      { ...payload },
      { expiresIn: this.accessTtlSegundos },
    );
  }

  async verificarAccess(token: string): Promise<AccessTokenPayload | null> {
    try {
      const p = await this.jwt.verifyAsync<Record<string, unknown>>(token);
      if (
        typeof p.sub !== 'string' ||
        typeof p.email !== 'string' ||
        !esRol(p.rol)
      ) {
        return null;
      }
      return { sub: p.sub, email: p.email, rol: p.rol };
    } catch {
      return null;
    }
  }

  generarRefresh(): string {
    return randomBytes(48).toString('base64url');
  }

  hashRefresh(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
