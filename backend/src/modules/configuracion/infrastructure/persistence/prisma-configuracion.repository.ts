import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import type {
  ConfiguracionBiblioteca,
  ConfiguracionRepository,
} from '../../domain/repositories/configuracion.repository';

@Injectable()
export class PrismaConfiguracionRepository implements ConfiguracionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async obtener() {
    const datos = await this.prisma.configuracionBiblioteca.findUnique({
      where: { id: 1 },
    });
    return (
      datos && {
        horarios: datos.horarios,
        telefono: datos.telefono,
        correo: datos.correo,
      }
    );
  }

  async guardar(datos: ConfiguracionBiblioteca) {
    const resultado = await this.prisma.configuracionBiblioteca.upsert({
      where: { id: 1 },
      create: { id: 1, ...datos },
      update: datos,
    });
    return {
      horarios: resultado.horarios,
      telefono: resultado.telefono,
      correo: resultado.correo,
    };
  }
}
