import { Body, Controller, Get, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Autenticado } from '../../../auth/presentation/decorators/autenticado.decorator';
import { Rol } from '../../../auth/domain/value-objects/rol';
import { ErrorResponse } from '../../../../shared/presentation/http/error-response';
import {
  CrearUbicacionUseCase,
  ListarUbicacionesUseCase,
} from '../../application/use-cases/ubicaciones.use-cases';
import { UbicacionResponse } from '../dtos/ejemplar-response.dto';
import { CrearUbicacionDto } from '../dtos/ubicacion-request.dto';

/**
 * HU-25: ubicaciones físicas (sala, sección, estante) para registrar ejemplares desde el panel.
 * Listar es público; crear es solo para el personal y el administrador.
 */
@ApiTags('ubicaciones')
@Controller('ubicaciones')
export class UbicacionesController {
  constructor(
    private readonly listarUbicaciones: ListarUbicacionesUseCase,
    private readonly crearUbicacion: CrearUbicacionUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Listar las ubicaciones (ordenadas por sala, sección y estante)',
  })
  @ApiOkResponse({ type: [UbicacionResponse] })
  listar() {
    return this.listarUbicaciones.execute();
  }

  @Post()
  @Autenticado(Rol.PERSONAL, Rol.ADMINISTRADOR)
  @ApiOperation({
    summary:
      'Registrar una ubicación nueva (se le asigna un código imprimible)',
  })
  @ApiCreatedResponse({ type: UbicacionResponse })
  @ApiBadRequestResponse({ type: ErrorResponse })
  @ApiConflictResponse({
    description: 'Ya existe esa sala, sección y estante',
    type: ErrorResponse,
  })
  crear(@Body() dto: CrearUbicacionDto) {
    return this.crearUbicacion.execute(dto);
  }
}
