import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import type {
  SolicitudParticipacion,
  SolicitudRepository,
} from '../domain/solicitud';

@Injectable()
export class PrismaSolicitudRepository implements SolicitudRepository {
  constructor(private readonly prisma: PrismaService) {}

  async crear(solicitud: SolicitudParticipacion): Promise<void> {
    await this.prisma.solicitudParticipacion.create({ data: solicitud });
  }
}
