import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { REFRESH_TOKEN_REPOSITORY } from '../src/modules/auth/domain/repositories/refresh-token.repository';
import { USUARIO_REPOSITORY } from '../src/modules/auth/domain/repositories/usuario.repository';
import { PASSWORD_HASHER } from '../src/modules/auth/domain/services/password-hasher';
import { Rol } from '../src/modules/auth/domain/value-objects/rol';
import { PrismaService } from '../src/shared/infrastructure/prisma/prisma.service';
import {
  HasherFalso,
  RefreshTokensEnMemoria,
  UsuariosEnMemoria,
  usuarioDePrueba,
} from './fakes/auth.fakes';

interface Sesion {
  accessToken: string;
  refreshToken: string;
  usuario: { id: string; rol: string };
}

/** Flujo completo de autenticación con JWT reales y repositorios en memoria (HU-11, 12 y 13). */
describe('Autenticación y roles (e2e)', () => {
  let app: INestApplication<App>;
  const usuarios = new UsuariosEnMemoria();

  beforeAll(async () => {
    await usuarios.guardar(
      usuarioDePrueba({
        id: '11111111-1111-4111-8111-111111111111',
        email: 'admin@clena.test',
        rol: Rol.ADMINISTRADOR,
        password: 'clave-admin-1',
      }),
    );
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue({ $queryRaw: jest.fn(), $disconnect: jest.fn() })
      .overrideProvider(USUARIO_REPOSITORY)
      .useValue(usuarios)
      .overrideProvider(REFRESH_TOKEN_REPOSITORY)
      .useValue(new RefreshTokensEnMemoria())
      .overrideProvider(PASSWORD_HASHER)
      .useValue(new HasherFalso())
      .compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const http = () => request(app.getHttpServer());

  it('publica el aviso de privacidad', async () => {
    const res = await http().get('/api/v1/auth/aviso-privacidad').expect(200);
    expect(res.body).toMatchObject({ version: '1.0' });
  });

  it('exige aceptar el aviso de privacidad para registrarse', async () => {
    const res = await http()
      .post('/api/v1/auth/registro')
      .send({
        nombre: 'Ana',
        email: 'ana@example.com',
        password: 'clave-segura-1',
        aceptaAvisoPrivacidad: false,
      })
      .expect(400);
    expect(res.body).toMatchObject({ error: 'VALIDATION_ERROR' });
  });

  let publico: Sesion;

  it('registra un usuario público y devuelve la sesión', async () => {
    const res = await http()
      .post('/api/v1/auth/registro')
      .send({
        nombre: 'Ana',
        email: 'ana@example.com',
        password: 'clave-segura-1',
        aceptaAvisoPrivacidad: true,
      })
      .expect(201);
    publico = res.body as Sesion;
    expect(publico.usuario.rol).toBe('PUBLICO');
    expect(publico.accessToken.split('.')).toHaveLength(3); // JWT real
  });

  it('el correo repetido responde 409', () => {
    return http()
      .post('/api/v1/auth/registro')
      .send({
        nombre: 'Ana',
        email: 'ANA@example.com',
        password: 'clave-segura-1',
        aceptaAvisoPrivacidad: true,
      })
      .expect(409);
  });

  it('credenciales inválidas responden 401 con el formato uniforme', async () => {
    const res = await http()
      .post('/api/v1/auth/login')
      .send({ email: 'ana@example.com', password: 'otra-clave-9' })
      .expect(401);
    expect(res.body).toMatchObject({
      statusCode: 401,
      error: 'UNAUTHORIZED',
      path: '/api/v1/auth/login',
    });
  });

  it('GET /auth/me: 401 sin token, 200 con token', async () => {
    await http().get('/api/v1/auth/me').expect(401);
    await http()
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer token.invalido.x')
      .expect(401);
    const res = await http()
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${publico.accessToken}`)
      .expect(200);
    expect(res.body).toMatchObject({ email: 'ana@example.com' });
  });

  it('un usuario público recibe 403 en rutas de administrador', async () => {
    const res = await http()
      .get('/api/v1/usuarios')
      .set('Authorization', `Bearer ${publico.accessToken}`)
      .expect(403);
    expect(res.body).toMatchObject({ error: 'FORBIDDEN' });
  });

  it('el administrador lista usuarios y cambia un rol', async () => {
    const login = await http()
      .post('/api/v1/auth/login')
      .send({ email: 'admin@clena.test', password: 'clave-admin-1' })
      .expect(200);
    const admin = login.body as Sesion;

    const lista = await http()
      .get('/api/v1/usuarios?pagina=1&tamano=10')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200);
    expect(lista.body).toMatchObject({ total: 2, pagina: 1, tamano: 10 });

    const cambio = await http()
      .patch(`/api/v1/usuarios/${publico.usuario.id}/rol`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ rol: 'PERSONAL' })
      .expect(200);
    expect(cambio.body).toMatchObject({ rol: 'PERSONAL' });

    await http()
      .patch(`/api/v1/usuarios/${admin.usuario.id}/rol`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ rol: 'PUBLICO' })
      .expect(400);
  });

  it('refresh rota el token y logout lo invalida', async () => {
    const r1 = await http()
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: publico.refreshToken })
      .expect(200);
    const nueva = r1.body as Sesion;
    expect(nueva.refreshToken).not.toBe(publico.refreshToken);
    expect(nueva.usuario.rol).toBe('PERSONAL'); // el token nuevo trae el rol actualizado

    await http()
      .post('/api/v1/auth/logout')
      .send({ refreshToken: nueva.refreshToken })
      .expect(204);
    await http()
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: nueva.refreshToken })
      .expect(401);
  });
});
