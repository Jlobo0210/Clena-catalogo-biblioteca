import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { RegistrarSolicitudUseCase } from '../application/registrar-solicitud.use-case';
import { CrearSolicitudDto } from './crear-solicitud.dto';

@Controller('solicitudes-participacion')
export class SolicitudesController {
  constructor(private readonly registrar: RegistrarSolicitudUseCase) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async crear(@Body() dto: CrearSolicitudDto): Promise<{ registrado: true }> {
    await this.registrar.ejecutar(dto);
    return { registrado: true };
  }
}
