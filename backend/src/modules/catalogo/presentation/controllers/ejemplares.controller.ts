import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Autenticado } from '../../../auth/presentation/decorators/autenticado.decorator';
import { Rol } from '../../../auth/domain/value-objects/rol';
import { ErrorResponse } from '../../../../shared/presentation/http/error-response';
import { CrearEjemplarUseCase } from '../../application/use-cases/crear-ejemplar.use-case';
import { ObtenerEjemplarUseCase } from '../../application/use-cases/obtener-ejemplar.use-case';
import { ListarEjemplaresUseCase } from '../../application/use-cases/listar-ejemplares.use-case';
import { ActualizarEjemplarUseCase } from '../../application/use-cases/actualizar-ejemplar.use-case';
import { EliminarEjemplarUseCase } from '../../application/use-cases/eliminar-ejemplar.use-case';
import {
  CrearEjemplarDto,
  ActualizarEjemplarDto,
} from '../dtos/ejemplar-request.dto';
import {
  EjemplarResponse,
  ListaEjemplaresResponse,
} from '../dtos/ejemplar-response.dto';

/**
 * HU-17: gestión de ejemplares.
 * Listar y consultar es público; crear, editar y eliminar es solo para el personal y el administrador.
 */
@ApiTags('ejemplares')
@Controller('libros/:libroId/ejemplares')
export class EjemplaresController {
  constructor(
    private readonly crearEjemplar: CrearEjemplarUseCase,
    private readonly obtenerEjemplar: ObtenerEjemplarUseCase,
    private readonly listarEjemplares: ListarEjemplaresUseCase,
    private readonly actualizarEjemplar: ActualizarEjemplarUseCase,
    private readonly eliminarEjemplar: EliminarEjemplarUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Listar ejemplares de un libro con disponibilidad',
  })
  @ApiOkResponse({ type: ListaEjemplaresResponse })
  @ApiNotFoundResponse({ type: ErrorResponse })
  listar(@Param('libroId', new ParseUUIDPipe()) libroId: string) {
    return this.listarEjemplares.execute(libroId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar un ejemplar' })
  @ApiOkResponse({ type: EjemplarResponse })
  @ApiNotFoundResponse({ type: ErrorResponse })
  obtener(
    @Param('libroId', new ParseUUIDPipe()) libroId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.obtenerEjemplar.execute(libroId, id);
  }

  @Post()
  @Autenticado(Rol.PERSONAL, Rol.ADMINISTRADOR)
  @ApiOperation({ summary: 'Registrar un ejemplar' })
  @ApiCreatedResponse({ type: EjemplarResponse })
  @ApiBadRequestResponse({ type: ErrorResponse })
  @ApiNotFoundResponse({ type: ErrorResponse })
  @ApiConflictResponse({
    description: 'Código de inventario duplicado o libro solo digital',
    type: ErrorResponse,
  })
  crear(
    @Param('libroId', new ParseUUIDPipe()) libroId: string,
    @Body() dto: CrearEjemplarDto,
  ) {
    return this.crearEjemplar.execute(libroId, dto);
  }

  @Patch(':id')
  @Autenticado(Rol.PERSONAL, Rol.ADMINISTRADOR)
  @ApiOperation({ summary: 'Editar un ejemplar (solo los campos enviados)' })
  @ApiOkResponse({ type: EjemplarResponse })
  @ApiBadRequestResponse({ type: ErrorResponse })
  @ApiNotFoundResponse({ type: ErrorResponse })
  @ApiConflictResponse({
    description: 'Código de inventario duplicado',
    type: ErrorResponse,
  })
  actualizar(
    @Param('libroId', new ParseUUIDPipe()) libroId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ActualizarEjemplarDto,
  ) {
    return this.actualizarEjemplar.execute(libroId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Autenticado(Rol.PERSONAL, Rol.ADMINISTRADOR)
  @ApiOperation({ summary: 'Eliminar un ejemplar sin préstamos activos' })
  @ApiNoContentResponse({ description: 'Ejemplar eliminado' })
  @ApiNotFoundResponse({ type: ErrorResponse })
  @ApiConflictResponse({
    description: 'El ejemplar tiene préstamos activos',
    type: ErrorResponse,
  })
  async eliminar(
    @Param('libroId', new ParseUUIDPipe()) libroId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<void> {
    await this.eliminarEjemplar.execute(libroId, id);
  }
}
