import {
  Controller,
  Delete,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AccessTokenPayload } from '../../../../modules/auth/domain/services/token-service';
import { Autenticado } from '../../../../modules/auth/presentation/decorators/autenticado.decorator';
import { UsuarioActual } from '../../../../modules/auth/presentation/decorators/usuario-actual.decorator';
import { CancelarSuscripcionUseCase } from '../../application/use-cases/cancelar-suscripcion.use-case';
import { SuscribirseUseCase } from '../../application/use-cases/suscribirse.use-case';

@ApiTags('suscripciones')
@Controller('libros/:libroId/suscripcion')
export class SuscripcionesController {
  constructor(
    private readonly suscribirse: SuscribirseUseCase,
    private readonly cancelar: CancelarSuscripcionUseCase,
  ) {}

  /** HU-30: suscribirse para recibir aviso cuando el libro esté disponible. */
  @Post()
  @Autenticado()
  @ApiOperation({ summary: 'Suscribirse a disponibilidad del libro' })
  async crear(
    @Param('libroId', new ParseUUIDPipe()) libroId: string,
    @UsuarioActual() usuario: AccessTokenPayload,
  ) {
    return this.suscribirse.execute({ usuarioId: usuario.sub, libroId });
  }

  /** HU-30: cancelar la suscripción activa para este libro. */
  @Delete(':id')
  @HttpCode(204)
  @Autenticado()
  @ApiOperation({ summary: 'Cancelar suscripción de disponibilidad' })
  async cancelarSuscripcion(
    @Param('id', new ParseUUIDPipe()) id: string,
    @UsuarioActual() usuario: AccessTokenPayload,
  ): Promise<void> {
    await this.cancelar.execute(id, usuario.sub);
  }
}
