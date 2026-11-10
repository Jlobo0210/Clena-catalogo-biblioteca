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
  Query,
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
import { Rol } from '../../../auth/domain/value-objects/rol';
import { Autenticado } from '../../../auth/presentation/decorators/autenticado.decorator';
import { ErrorResponse } from '../../../../shared/presentation/http/error-response';
import { ActualizarTemaUseCase } from '../../application/use-cases/actualizar-tema.use-case';
import { CrearTemaUseCase } from '../../application/use-cases/crear-tema.use-case';
import { EliminarTemaUseCase } from '../../application/use-cases/eliminar-tema.use-case';
import { ListarTemasUseCase } from '../../application/use-cases/listar-temas.use-case';
import { ObtenerTemaUseCase } from '../../application/use-cases/obtener-tema.use-case';
import {
  ActualizarTemaDto,
  CrearTemaDto,
  ListarTemasQueryDto,
} from '../dtos/tema-request.dto';
import { TemaResponse, PaginaTemasResponse } from '../dtos/tema-response.dto';

/**
 * HU-15: gestión de temas.
 * Consultar es público; crear, editar y eliminar es solo para el personal y el administrador.
 */
@ApiTags('temas')
@Controller('temas')
export class TemasController {
  constructor(
    private readonly crearTema: CrearTemaUseCase,
    private readonly obtenerTema: ObtenerTemaUseCase,
    private readonly listarTemas: ListarTemasUseCase,
    private readonly actualizarTema: ActualizarTemaUseCase,
    private readonly eliminarTema: EliminarTemaUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary:
      'Listar temas con la cantidad de libros (paginado, filtro por nombre y ordenamiento)',
  })
  @ApiOkResponse({ type: PaginaTemasResponse })
  @ApiBadRequestResponse({ type: ErrorResponse })
  listar(@Query() query: ListarTemasQueryDto) {
    return this.listarTemas.execute(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar un tema' })
  @ApiOkResponse({ type: TemaResponse })
  @ApiNotFoundResponse({ type: ErrorResponse })
  obtener(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.obtenerTema.execute(id);
  }

  @Post()
  @Autenticado(Rol.PERSONAL, Rol.ADMINISTRADOR)
  @ApiOperation({ summary: 'Registrar un tema' })
  @ApiCreatedResponse({ type: TemaResponse })
  @ApiBadRequestResponse({ type: ErrorResponse })
  @ApiConflictResponse({
    description: 'Ya existe un tema con ese nombre',
    type: ErrorResponse,
  })
  crear(@Body() dto: CrearTemaDto) {
    return this.crearTema.execute(dto);
  }

  @Patch(':id')
  @Autenticado(Rol.PERSONAL, Rol.ADMINISTRADOR)
  @ApiOperation({ summary: 'Editar el nombre o la descripción de un tema' })
  @ApiOkResponse({ type: TemaResponse })
  @ApiBadRequestResponse({ type: ErrorResponse })
  @ApiNotFoundResponse({ type: ErrorResponse })
  @ApiConflictResponse({
    description: 'Ya existe un tema con ese nombre',
    type: ErrorResponse,
  })
  actualizar(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ActualizarTemaDto,
  ) {
    return this.actualizarTema.execute(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Autenticado(Rol.PERSONAL, Rol.ADMINISTRADOR)
  @ApiOperation({ summary: 'Eliminar un tema sin libros clasificados' })
  @ApiNoContentResponse({ description: 'Tema eliminado' })
  @ApiNotFoundResponse({ type: ErrorResponse })
  @ApiConflictResponse({
    description: 'El tema tiene libros clasificados',
    type: ErrorResponse,
  })
  async eliminar(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
    await this.eliminarTema.execute(id);
  }
}
