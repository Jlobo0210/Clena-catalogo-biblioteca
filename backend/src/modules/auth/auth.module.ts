import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ID_GENERATOR, IdGenerator } from '../../shared/domain/id-generator';
import { UuidIdGenerator } from '../../shared/infrastructure/uuid-id-generator';
import { CambiarRolUseCase } from './application/use-cases/cambiar-rol.use-case';
import { CerrarSesionUseCase } from './application/use-cases/cerrar-sesion.use-case';
import { EliminarCuentaUseCase } from './application/use-cases/eliminar-cuenta.use-case';
import { EmisorSesion } from './application/use-cases/emisor-sesion';
import { IniciarSesionUseCase } from './application/use-cases/iniciar-sesion.use-case';
import { ListarUsuariosUseCase } from './application/use-cases/listar-usuarios.use-case';
import { ObtenerPerfilUseCase } from './application/use-cases/obtener-perfil.use-case';
import { RefrescarSesionUseCase } from './application/use-cases/refrescar-sesion.use-case';
import { RegistrarUsuarioUseCase } from './application/use-cases/registrar-usuario.use-case';
import {
  REFRESH_TOKEN_REPOSITORY,
  RefreshTokenRepository,
} from './domain/repositories/refresh-token.repository';
import {
  USUARIO_REPOSITORY,
  UsuarioRepository,
} from './domain/repositories/usuario.repository';
import {
  PASSWORD_HASHER,
  PasswordHasher,
} from './domain/services/password-hasher';
import { TOKEN_SERVICE, TokenService } from './domain/services/token-service';
import { PrismaRefreshTokenRepository } from './infrastructure/persistence/prisma-refresh-token.repository';
import { PrismaUsuarioRepository } from './infrastructure/persistence/prisma-usuario.repository';
import { BcryptPasswordHasher } from './infrastructure/security/bcrypt-password-hasher';
import { JwtTokenService } from './infrastructure/security/jwt-token.service';
import { AuthController } from './presentation/controllers/auth.controller';
import { UsuariosController } from './presentation/controllers/usuarios.controller';
import { JwtAuthGuard } from './presentation/guards/jwt-auth.guard';
import { RolesGuard } from './presentation/guards/roles.guard';

/**
 * Autenticación y roles (HU-11, HU-12, HU-13).
 * Es global y exporta los guards y el TokenService para que cualquier módulo use @Autenticado(...).
 */
@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.get<string>('JWT_ACCESS_SECRET');
        if (!secret || secret.length < 32) {
          throw new Error(
            'Falta JWT_ACCESS_SECRET (mínimo 32 caracteres) en las variables de entorno. Ver .env.example',
          );
        }
        return { secret, signOptions: { algorithm: 'HS256' } };
      },
    }),
  ],
  controllers: [AuthController, UsuariosController],
  providers: [
    { provide: USUARIO_REPOSITORY, useClass: PrismaUsuarioRepository },
    {
      provide: REFRESH_TOKEN_REPOSITORY,
      useClass: PrismaRefreshTokenRepository,
    },
    { provide: PASSWORD_HASHER, useFactory: () => new BcryptPasswordHasher() },
    { provide: TOKEN_SERVICE, useClass: JwtTokenService },
    { provide: ID_GENERATOR, useClass: UuidIdGenerator },
    {
      provide: EmisorSesion,
      useFactory: (
        t: TokenService,
        r: RefreshTokenRepository,
        ids: IdGenerator,
      ) => new EmisorSesion(t, r, ids),
      inject: [TOKEN_SERVICE, REFRESH_TOKEN_REPOSITORY, ID_GENERATOR],
    },
    {
      provide: RegistrarUsuarioUseCase,
      useFactory: (
        u: UsuarioRepository,
        h: PasswordHasher,
        e: EmisorSesion,
        ids: IdGenerator,
      ) => new RegistrarUsuarioUseCase(u, h, e, ids),
      inject: [USUARIO_REPOSITORY, PASSWORD_HASHER, EmisorSesion, ID_GENERATOR],
    },
    {
      provide: IniciarSesionUseCase,
      useFactory: (u: UsuarioRepository, h: PasswordHasher, e: EmisorSesion) =>
        new IniciarSesionUseCase(u, h, e),
      inject: [USUARIO_REPOSITORY, PASSWORD_HASHER, EmisorSesion],
    },
    {
      provide: RefrescarSesionUseCase,
      useFactory: (
        r: RefreshTokenRepository,
        u: UsuarioRepository,
        t: TokenService,
        e: EmisorSesion,
      ) => new RefrescarSesionUseCase(r, u, t, e),
      inject: [
        REFRESH_TOKEN_REPOSITORY,
        USUARIO_REPOSITORY,
        TOKEN_SERVICE,
        EmisorSesion,
      ],
    },
    {
      provide: CerrarSesionUseCase,
      useFactory: (r: RefreshTokenRepository, t: TokenService) =>
        new CerrarSesionUseCase(r, t),
      inject: [REFRESH_TOKEN_REPOSITORY, TOKEN_SERVICE],
    },
    {
      provide: EliminarCuentaUseCase,
      useFactory: (u: UsuarioRepository, h: PasswordHasher) =>
        new EliminarCuentaUseCase(u, h),
      inject: [USUARIO_REPOSITORY, PASSWORD_HASHER],
    },
    {
      provide: ObtenerPerfilUseCase,
      useFactory: (u: UsuarioRepository) => new ObtenerPerfilUseCase(u),
      inject: [USUARIO_REPOSITORY],
    },
    {
      provide: ListarUsuariosUseCase,
      useFactory: (u: UsuarioRepository) => new ListarUsuariosUseCase(u),
      inject: [USUARIO_REPOSITORY],
    },
    {
      provide: CambiarRolUseCase,
      useFactory: (u: UsuarioRepository) => new CambiarRolUseCase(u),
      inject: [USUARIO_REPOSITORY],
    },
    JwtAuthGuard,
    RolesGuard,
  ],
  exports: [TOKEN_SERVICE, JwtAuthGuard, RolesGuard],
})
export class AuthModule {}
