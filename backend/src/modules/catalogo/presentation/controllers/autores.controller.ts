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
import { ActualizarAutorUseCase } from '../../application/use-cases/actualizar-autor.use-case';
import { CrearAutorUseCase } from '../../application/use-cases/crear-autor.use-case';
import { EliminarAutorUseCase } from '../../application/use-cases/eliminar-autor.use-case';
import { ListarAutoresUseCase } from '../../application/use-cases/listar-autores.use-case';
import { ObtenerAutorUseCase } from '../../application/use-cases/obtener-autor.use-case';
import {
  ActualizarAutorDto,
  CrearAutorDto,
  ListarAutoresQueryDto,
} from '../dtos/autor-request.dto';
import {
  AutorResponse,
  PaginaAutoresResponse,
} from '../dtos/autor-response.dto';

/**
 * HU-14: gestión de autores.
 * Consultar es público; crear, editar y eliminar es solo para el personal y el administrador.
 */
@ApiTags('autores')
@Controller('autores')
export class AutoresController {
  constructor(
    private readonly crearAutor: CrearAutorUseCase,
    private readonly obtenerAutor: ObtenerAutorUseCase,
    private readonly listarAutores: ListarAutoresUseCase,
    private readonly actualizarAutor: ActualizarAutorUseCase,
    private readonly eliminarAutor: EliminarAutorUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Listar autores (paginado, filtro por nombre y ordenamiento)',
  })
  @ApiOkResponse({ type: PaginaAutoresResponse })
  @ApiBadRequestResponse({ type: ErrorResponse })
  listar(@Query() query: ListarAutoresQueryDto) {
    return this.listarAutores.execute(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar un autor' })
  @ApiOkResponse({ type: AutorResponse })
  @ApiNotFoundResponse({ type: ErrorResponse })
  obtener(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.obtenerAutor.execute(id);
  }

  @Post()
  @Autenticado(Rol.PERSONAL, Rol.ADMINISTRADOR)
  @ApiOperation({ summary: 'Registrar un autor' })
  @ApiCreatedResponse({ type: AutorResponse })
  @ApiBadRequestResponse({ type: ErrorResponse })
  crear(@Body() dto: CrearAutorDto) {
    return this.crearAutor.execute(dto);
  }

  @Patch(':id')
  @Autenticado(Rol.PERSONAL, Rol.ADMINISTRADOR)
  @ApiOperation({ summary: 'Editar un autor' })
  @ApiOkResponse({ type: AutorResponse })
  @ApiBadRequestResponse({ type: ErrorResponse })
  @ApiNotFoundResponse({ type: ErrorResponse })
  actualizar(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ActualizarAutorDto,
  ) {
    return this.actualizarAutor.execute(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Autenticado(Rol.PERSONAL, Rol.ADMINISTRADOR)
  @ApiOperation({ summary: 'Eliminar un autor sin libros asociados' })
  @ApiNoContentResponse({ description: 'Autor eliminado' })
  @ApiNotFoundResponse({ type: ErrorResponse })
  @ApiConflictResponse({
    description: 'El autor tiene libros asociados',
    type: ErrorResponse,
  })
  async eliminar(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
    await this.eliminarAutor.execute(id);
  }
}
