import { Body, Controller, Get, HttpCode, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import type { User } from '../generated/prisma/client.js';
import { AuthService } from './auth.service.js';
import { EmailDto, LoginDto, RegisterDto, ResetPasswordDto, TokenDto } from './dto/auth.dto.js';
import { SessionGuard } from './session.guard.js';
import { CurrentUser } from './current-user.decorator.js';
import { toPublicUser } from './public-user.js';
import { SESSION_COOKIE } from './auth.constants.js';
import { sessionCookieOptions } from './session-cookie.js';

// Límite estricto para las rutas sensibles: 5 pedidos por minuto por IP.
const STRICT = { default: { limit: 5, ttl: 60_000 } };

@Controller('auth')
export class AuthController {
  private readonly sessionDays: number;
  private readonly production: boolean;

  constructor(
    private readonly auth: AuthService,
    config: ConfigService,
  ) {
    this.sessionDays = Number(config.get('SESSION_DAYS', 7));
    this.production = config.get('NODE_ENV') === 'production';
  }

  @Post('register')
  @Throttle(STRICT)
  async register(@Body() dto: RegisterDto) {
    await this.auth.register(dto);
    return { message: 'Te enviamos un email para confirmar tu cuenta.' };
  }

  @Post('resend-verification')
  @HttpCode(200)
  @Throttle(STRICT)
  async resend(@Body() dto: EmailDto) {
    await this.auth.resendVerification(dto.email);
    return { message: 'Si tu cuenta está pendiente de confirmación, te enviamos un nuevo enlace.' };
  }

  @Post('verify-email')
  @HttpCode(200)
  async verify(@Body() dto: TokenDto) {
    await this.auth.verifyEmail(dto.token);
    return { message: 'Tu email quedó confirmado. Ya podés ingresar.' };
  }

  @Post('login')
  @HttpCode(200)
  @Throttle(STRICT)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { user, token } = await this.auth.login(dto.email, dto.password);
    res.cookie(SESSION_COOKIE, token, sessionCookieOptions(this.sessionDays, this.production));
    return toPublicUser(user);
  }

  @Post('logout')
  @HttpCode(200)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(SESSION_COOKIE, { path: '/' });
    return { message: 'Sesión cerrada.' };
  }

  @Post('forgot-password')
  @HttpCode(200)
  @Throttle(STRICT)
  async forgot(@Body() dto: EmailDto) {
    await this.auth.forgotPassword(dto.email);
    return { message: 'Si el email está registrado, te enviamos un enlace para restablecer la contraseña.' };
  }

  @Post('reset-password')
  @HttpCode(200)
  @Throttle(STRICT)
  async reset(@Body() dto: ResetPasswordDto) {
    await this.auth.resetPassword(dto.token, dto.password);
    return { message: 'Tu contraseña fue actualizada. Ya podés ingresar.' };
  }

  @Get('me')
  @UseGuards(SessionGuard)
  me(@CurrentUser() user: User) {
    return toPublicUser(user);
  }

  // Igual que /me pero sin error cuando no hay sesión: lo usa el front al arrancar.
  @Get('session')
  async session(@Req() req: Request) {
    const token: unknown = req.cookies?.[SESSION_COOKIE];
    const user = typeof token === 'string' ? await this.auth.validateSession(token) : null;
    return { user: user ? toPublicUser(user) : null };
  }
}
