import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ErrorResponse } from '../../../../shared/presentation/http/error-response';
import { CambiarRolUseCase } from '../../application/use-cases/cambiar-rol.use-case';
import { ListarUsuariosUseCase } from '../../application/use-cases/listar-usuarios.use-case';
import type { AccessTokenPayload } from '../../domain/services/token-service';
import { Rol } from '../../domain/value-objects/rol';
import { Autenticado } from '../decorators/autenticado.decorator';
import { UsuarioActual } from '../decorators/usuario-actual.decorator';
import {
  CambiarRolDto,
  ListarUsuariosQueryDto,
} from '../dtos/auth-request.dto';
import {
  PaginaUsuariosResponse,
  UsuarioResponse,
} from '../dtos/auth-response.dto';

/** HU-13: administración de usuarios y roles. Solo el administrador. */
@ApiTags('usuarios')
@Controller('usuarios')
@Autenticado(Rol.ADMINISTRADOR)
export class UsuariosController {
  constructor(
    private readonly listar: ListarUsuariosUseCase,
    private readonly cambiarRol: CambiarRolUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Listar usuarios (paginado, filtros por rol y texto)',
  })
  @ApiOkResponse({ type: PaginaUsuariosResponse })
  listarUsuarios(@Query() query: ListarUsuariosQueryDto) {
    return this.listar.execute(query);
  }

  @Patch(':id/rol')
  @ApiOperation({ summary: 'Cambiar el rol de un usuario' })
  @ApiOkResponse({ type: UsuarioResponse })
  @ApiBadRequestResponse({ type: ErrorResponse })
  @ApiNotFoundResponse({ type: ErrorResponse })
  cambiar(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: CambiarRolDto,
    @UsuarioActual() admin: AccessTokenPayload,
  ) {
    return this.cambiarRol.execute({
      usuarioId: id,
      rol: dto.rol,
      solicitadoPor: admin.sub,
    });
  }
}
