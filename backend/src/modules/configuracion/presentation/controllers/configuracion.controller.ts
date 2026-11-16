import { Body, Controller, Get, Put } from '@nestjs/common';
import { Rol } from '../../../auth/domain/value-objects/rol';
import { Autenticado } from '../../../auth/presentation/decorators/autenticado.decorator';
import { ConfiguracionUseCases } from '../../application/use-cases/configuracion.use-cases';
import { ConfiguracionDto } from '../dtos/configuracion.dto';

@Controller('configuracion-biblioteca')
export class ConfiguracionController {
  constructor(private readonly configuracion: ConfiguracionUseCases) {}

  @Get()
  obtener() {
    return this.configuracion.obtener();
  }

  @Put()
  @Autenticado(Rol.ADMINISTRADOR)
  guardar(@Body() datos: ConfiguracionDto) {
    return this.configuracion.guardar(datos);
  }
}
