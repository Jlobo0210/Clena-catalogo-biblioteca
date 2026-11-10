import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Rol } from '../../../auth/domain/value-objects/rol';
import type { AccessTokenPayload } from '../../../auth/domain/services/token-service';
import { Autenticado } from '../../../auth/presentation/decorators/autenticado.decorator';
import { UsuarioActual } from '../../../auth/presentation/decorators/usuario-actual.decorator';
import { ErrorResponse } from '../../../../shared/presentation/http/error-response';
import { ListarPrestamosUseCase } from '../../application/use-cases/listar-prestamos.use-case';
import { ObtenerPrestamoUseCase } from '../../application/use-cases/obtener-prestamo.use-case';
import { RegistrarDevolucionUseCase } from '../../application/use-cases/registrar-devolucion.use-case';
import { RegistrarPrestamoUseCase } from '../../application/use-cases/registrar-prestamo.use-case';
import {
  ListarPrestamosQueryDto,
  RegistrarPrestamoDto,
} from '../dtos/prestamo-request.dto';
import {
  PaginaPrestamosResponse,
  PrestamoResponse,
} from '../dtos/prestamo-response.dto';

/** HU-26: préstamos y devoluciones. Todo es solo para el personal y el administrador. */
@ApiTags('prestamos')
@Controller('prestamos')
@Autenticado(Rol.PERSONAL, Rol.ADMINISTRADOR)
export class PrestamosController {
  constructor(
    private readonly registrarPrestamo: RegistrarPrestamoUseCase,
    private readonly registrarDevolucion: RegistrarDevolucionUseCase,
    private readonly listarPrestamos: ListarPrestamosUseCase,
    private readonly obtenerPrestamo: ObtenerPrestamoUseCase,
  ) {}

  @Post()
  @ApiOperation({
    summary:
      'Prestar un ejemplar disponible a un usuario (calcula la fecha límite)',
  })
  @ApiCreatedResponse({ type: PrestamoResponse })
  @ApiBadRequestResponse({ type: ErrorResponse })
  @ApiNotFoundResponse({
    description: 'El ejemplar o el usuario no existen',
    type: ErrorResponse,
  })
  @ApiConflictResponse({
    description:
      'El ejemplar no está disponible o el usuario llegó al máximo de préstamos',
    type: ErrorResponse,
  })
  prestar(
    @Body() dto: RegistrarPrestamoDto,
    @UsuarioActual() personal: AccessTokenPayload,
  ) {
    return this.registrarPrestamo.execute(dto, personal.sub);
  }

  @Post(':id/devolucion')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Registrar la devolución: el ejemplar vuelve a estar disponible',
  })
  @ApiOkResponse({ type: PrestamoResponse })
  @ApiNotFoundResponse({ type: ErrorResponse })
  @ApiConflictResponse({
    description: 'El préstamo ya fue devuelto',
    type: ErrorResponse,
  })
  devolver(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.registrarDevolucion.execute(id);
  }

  @Get()
  @ApiOperation({
    summary: 'Historial de préstamos (filtros por estado, usuario y ejemplar)',
  })
  @ApiOkResponse({ type: PaginaPrestamosResponse })
  @ApiBadRequestResponse({ type: ErrorResponse })
  listar(@Query() query: ListarPrestamosQueryDto) {
    return this.listarPrestamos.execute(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar un préstamo' })
  @ApiOkResponse({ type: PrestamoResponse })
  @ApiNotFoundResponse({ type: ErrorResponse })
  obtener(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.obtenerPrestamo.execute(id);
  }
}
