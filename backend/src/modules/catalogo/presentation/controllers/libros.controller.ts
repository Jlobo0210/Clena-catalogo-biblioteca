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
import { Autenticado } from '../../../auth/presentation/decorators/autenticado.decorator';
import { Rol } from '../../../auth/domain/value-objects/rol';
import { ErrorResponse } from '../../../../shared/presentation/http/error-response';
import { ActualizarLibroUseCase } from '../../application/use-cases/actualizar-libro.use-case';
import { BuscarLibrosUseCase } from '../../application/use-cases/buscar-libros.use-case';
import { CrearLibroUseCase } from '../../application/use-cases/crear-libro.use-case';
import { EliminarLibroUseCase } from '../../application/use-cases/eliminar-libro.use-case';
import { ListarLibrosUseCase } from '../../application/use-cases/listar-libros.use-case';
import { ObtenerLibroUseCase } from '../../application/use-cases/obtener-libro.use-case';
import {
  ActualizarLibroDto,
  BuscarLibrosQueryDto,
  CrearLibroDto,
  ListarLibrosQueryDto,
} from '../dtos/libro-request.dto';
import {
  LibroResponse,
  PaginaLibrosResponse,
} from '../dtos/libro-response.dto';

/**
 * HU-16: gestión de libros. HU-20: búsqueda simple.
 * Consultar y buscar es público; crear, editar y eliminar es solo para el personal y el administrador.
 */
@ApiTags('libros')
@Controller('libros')
export class LibrosController {
  constructor(
    private readonly crearLibro: CrearLibroUseCase,
    private readonly obtenerLibro: ObtenerLibroUseCase,
    private readonly listarLibros: ListarLibrosUseCase,
    private readonly actualizarLibro: ActualizarLibroUseCase,
    private readonly eliminarLibro: EliminarLibroUseCase,
    private readonly buscarLibros: BuscarLibrosUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar libros (paginado, filtros y ordenamiento)' })
  @ApiOkResponse({ type: PaginaLibrosResponse })
  @ApiBadRequestResponse({ type: ErrorResponse })
  listar(@Query() query: ListarLibrosQueryDto) {
    return this.listarLibros.execute(query);
  }

  // Va antes de GET :id para que «buscar» no se interprete como un id.
  @Get('buscar')
  @ApiOperation({
    summary: 'Buscar libros por título, autor o tema (un solo campo)',
    description:
      'Público. Cada palabra debe aparecer en el título, en un autor o en un tema. Ordenado por relevancia.',
  })
  @ApiOkResponse({ type: PaginaLibrosResponse })
  @ApiBadRequestResponse({ type: ErrorResponse })
  buscar(@Query() query: BuscarLibrosQueryDto) {
    return this.buscarLibros.execute(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar un libro' })
  @ApiOkResponse({ type: LibroResponse })
  @ApiNotFoundResponse({ type: ErrorResponse })
  obtener(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.obtenerLibro.execute(id);
  }

  @Post()
  @Autenticado(Rol.PERSONAL, Rol.ADMINISTRADOR)
  @ApiOperation({ summary: 'Registrar un libro' })
  @ApiCreatedResponse({ type: LibroResponse })
  @ApiBadRequestResponse({ type: ErrorResponse })
  @ApiConflictResponse({
    description: 'El ISBN ya está registrado',
    type: ErrorResponse,
  })
  crear(@Body() dto: CrearLibroDto) {
    return this.crearLibro.execute(dto);
  }

  @Patch(':id')
  @Autenticado(Rol.PERSONAL, Rol.ADMINISTRADOR)
  @ApiOperation({
    summary: 'Editar un libro (solo los campos enviados)',
  })
  @ApiOkResponse({ type: LibroResponse })
  @ApiBadRequestResponse({ type: ErrorResponse })
  @ApiNotFoundResponse({ type: ErrorResponse })
  @ApiConflictResponse({
    description: 'ISBN repetido, o paso a solo digital con ejemplares',
    type: ErrorResponse,
  })
  actualizar(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ActualizarLibroDto,
  ) {
    return this.actualizarLibro.execute(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Autenticado(Rol.PERSONAL, Rol.ADMINISTRADOR)
  @ApiOperation({ summary: 'Eliminar un libro sin ejemplares' })
  @ApiNoContentResponse({ description: 'Libro eliminado' })
  @ApiNotFoundResponse({ type: ErrorResponse })
  @ApiConflictResponse({
    description: 'El libro tiene ejemplares',
    type: ErrorResponse,
  })
  async eliminar(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
    await this.eliminarLibro.execute(id);
  }
}
