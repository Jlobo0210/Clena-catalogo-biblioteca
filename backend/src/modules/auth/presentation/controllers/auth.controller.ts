import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ErrorResponse } from '../../../../shared/presentation/http/error-response';
import { AVISO_PRIVACIDAD } from '../../application/aviso-privacidad';
import { CerrarSesionUseCase } from '../../application/use-cases/cerrar-sesion.use-case';
import { EliminarCuentaUseCase } from '../../application/use-cases/eliminar-cuenta.use-case';
import { IniciarSesionUseCase } from '../../application/use-cases/iniciar-sesion.use-case';
import { ObtenerPerfilUseCase } from '../../application/use-cases/obtener-perfil.use-case';
import { RefrescarSesionUseCase } from '../../application/use-cases/refrescar-sesion.use-case';
import { RegistrarUsuarioUseCase } from '../../application/use-cases/registrar-usuario.use-case';
import type { AccessTokenPayload } from '../../domain/services/token-service';
import { Autenticado } from '../decorators/autenticado.decorator';
import { UsuarioActual } from '../decorators/usuario-actual.decorator';
import {
  EliminarCuentaDto,
  LoginDto,
  RefreshDto,
  RegistroDto,
} from '../dtos/auth-request.dto';
import {
  AvisoPrivacidadResponse,
  SesionResponse,
  UsuarioResponse,
} from '../dtos/auth-response.dto';

@ApiTags('autenticación')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registrar: RegistrarUsuarioUseCase,
    private readonly iniciarSesion: IniciarSesionUseCase,
    private readonly refrescar: RefrescarSesionUseCase,
    private readonly cerrarSesion: CerrarSesionUseCase,
    private readonly perfil: ObtenerPerfilUseCase,
    private readonly eliminarCuenta: EliminarCuentaUseCase,
  ) {}

  @Get('aviso-privacidad')
  @ApiOperation({ summary: 'Aviso de privacidad vigente (Ley 1581 de 2012)' })
  @ApiOkResponse({ type: AvisoPrivacidadResponse })
  avisoPrivacidad() {
    return AVISO_PRIVACIDAD;
  }

  @Post('registro')
  @ApiOperation({
    summary:
      'Crear una cuenta de usuario público aceptando el aviso de privacidad',
  })
  @ApiCreatedResponse({ type: SesionResponse })
  @ApiBadRequestResponse({ type: ErrorResponse })
  @ApiConflictResponse({
    description: 'El correo ya existe',
    type: ErrorResponse,
  })
  registro(@Body() dto: RegistroDto) {
    return this.registrar.execute(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Iniciar sesión: devuelve access token y refresh token',
  })
  @ApiOkResponse({ type: SesionResponse })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  login(@Body() dto: LoginDto) {
    return this.iniciarSesion.execute(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Renovar la sesión (el refresh token usado se invalida y se entrega uno nuevo)',
  })
  @ApiOkResponse({ type: SesionResponse })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  refresh(@Body() dto: RefreshDto) {
    return this.refrescar.execute(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cerrar sesión: invalida el refresh token' })
  @ApiNoContentResponse()
  async logout(@Body() dto: RefreshDto): Promise<void> {
    await this.cerrarSesion.execute(dto.refreshToken);
  }

  @Get('me')
  @Autenticado()
  @ApiOperation({ summary: 'Datos del usuario con sesión iniciada' })
  @ApiOkResponse({ type: UsuarioResponse })
  me(@UsuarioActual() usuario: AccessTokenPayload) {
    return this.perfil.execute(usuario.sub);
  }

  @Delete('cuenta')
  @Autenticado()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary:
      'Eliminar la propia cuenta: anonimiza los datos personales (Ley 1581 de 2012)',
  })
  @ApiNoContentResponse({ description: 'Cuenta eliminada' })
  @ApiBadRequestResponse({
    description: 'Falta la contraseña o no es correcta',
    type: ErrorResponse,
  })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  @ApiConflictResponse({
    description:
      'Tiene préstamos sin devolver o es una cuenta de administración',
    type: ErrorResponse,
  })
  async eliminar(
    @UsuarioActual() usuario: AccessTokenPayload,
    @Body() dto: EliminarCuentaDto,
  ): Promise<void> {
    await this.eliminarCuenta.execute(usuario.sub, dto);
  }
}
