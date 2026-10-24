import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { hash, verify } from '@node-rs/argon2';
import { PrismaService } from '../prisma/prisma.service.js';
import { MailService } from '../mail/mail.service.js';
import { TokenType, UserStatus, type User } from '../generated/prisma/client.js';
import { createOneTimeToken, hashToken } from './tokens.js';
import { RESET_TOKEN_MINUTES, VERIFY_TOKEN_HOURS } from './auth.constants.js';
import type { RegisterDto } from './dto/auth.dto.js';

export interface SessionPayload {
  sub: string;
  v: number;
}

@Injectable()
export class AuthService {
  private readonly webOrigin: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly jwt: JwtService,
    config: ConfigService,
  ) {
    this.webOrigin = config.get<string>('WEB_ORIGIN', 'http://localhost:4200');
  }

  // ───────────── Registro y verificación ─────────────

  async register(dto: RegisterDto): Promise<void> {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });

    // La respuesta es siempre la misma para no revelar qué emails están registrados.
    if (existing) {
      if (existing.emailVerifiedAt) {
        await this.mail.send({
          to: existing.email,
          subject: 'Ya tenés una cuenta',
          text: `Alguien intentó registrarse con tu email, pero ya tenés una cuenta.\n\nIngresá: ${this.webOrigin}/ingresar\nSi no recordás la contraseña: ${this.webOrigin}/recuperar`,
        });
      } else {
        await this.sendVerification(existing);
      }
      return;
    }

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash: await hash(dto.password),
        displayName: dto.displayName,
      },
    });
    await this.sendVerification(user);
  }

  async resendVerification(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (user && !user.emailVerifiedAt && user.status === UserStatus.ACTIVO) {
      await this.sendVerification(user);
    }
  }

  async verifyEmail(token: string): Promise<void> {
    const record = await this.consumeToken(token, TokenType.VERIFICACION_EMAIL);
    await this.prisma.user.update({
      where: { id: record.userId },
      data: { emailVerifiedAt: new Date() },
    });
  }

  private async sendVerification(user: User): Promise<void> {
    const link = await this.issueToken(user.id, TokenType.VERIFICACION_EMAIL, VERIFY_TOKEN_HOURS * 60);
    await this.mail.send({
      to: user.email,
      subject: 'Confirmá tu email',
      text: `Hola ${user.displayName}:\n\nPara activar tu cuenta, abrí este enlace:\n${this.webOrigin}/verificar-email?token=${link}\n\nEl enlace vence en ${VERIFY_TOKEN_HOURS} horas.`,
    });
  }

  // ───────────── Sesión ─────────────

  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    const valid = user ? await verify(user.passwordHash, password) : false;

    if (!user || !valid || user.status === UserStatus.ELIMINADO) {
      throw new UnauthorizedException('Email o contraseña incorrectos.');
    }
    if (user.status === UserStatus.SUSPENDIDO) {
      throw new ForbiddenException({ code: 'CUENTA_SUSPENDIDA', message: 'Tu cuenta está suspendida.' });
    }
    if (!user.emailVerifiedAt) {
      throw new ForbiddenException({
        code: 'EMAIL_NO_VERIFICADO',
        message: 'Confirmá tu email antes de ingresar. Revisá tu casilla o pedí un nuevo enlace.',
      });
    }

    const payload: SessionPayload = { sub: user.id, v: user.sessionVersion };
    return { user, token: await this.jwt.signAsync(payload) };
  }

  // Devuelve el usuario si la sesión sigue siendo válida; si no, null.
  async validateSession(token: string): Promise<User | null> {
    try {
      const payload = await this.jwt.verifyAsync<SessionPayload>(token);
      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user || user.status !== UserStatus.ACTIVO || user.sessionVersion !== payload.v) {
        return null;
      }
      return user;
    } catch {
      return null;
    }
  }

  // ───────────── Recupero de contraseña ─────────────

  async forgotPassword(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || user.status !== UserStatus.ACTIVO) return;

    const link = await this.issueToken(user.id, TokenType.RECUPERO_PASSWORD, RESET_TOKEN_MINUTES);
    await this.mail.send({
      to: user.email,
      subject: 'Restablecé tu contraseña',
      text: `Hola ${user.displayName}:\n\nPara elegir una contraseña nueva, abrí este enlace:\n${this.webOrigin}/restablecer?token=${link}\n\nVence en ${RESET_TOKEN_MINUTES} minutos. Si no lo pediste, ignorá este email.`,
    });
  }

  async resetPassword(token: string, password: string): Promise<void> {
    const record = await this.consumeToken(token, TokenType.RECUPERO_PASSWORD);
    await this.prisma.user.update({
      where: { id: record.userId },
      data: {
        passwordHash: await hash(password),
        sessionVersion: { increment: 1 }, // cierra todas las sesiones abiertas
        emailVerifiedAt: { set: new Date() }, // quien recibió el email es dueño de la casilla
      },
    });
  }

  // ───────────── Tokens de un solo uso ─────────────

  // Crea un token nuevo y anula los anteriores del mismo tipo sin usar.
  private async issueToken(userId: string, type: TokenType, minutes: number): Promise<string> {
    const { token, hash: tokenHash } = createOneTimeToken();
    await this.prisma.$transaction([
      this.prisma.authToken.updateMany({
        where: { userId, type, usedAt: null },
        data: { usedAt: new Date() },
      }),
      this.prisma.authToken.create({
        data: { userId, type, tokenHash, expiresAt: new Date(Date.now() + minutes * 60_000) },
      }),
    ]);
    return token;
  }

  private async consumeToken(token: string, type: TokenType) {
    const record = await this.prisma.authToken.findUnique({ where: { tokenHash: hashToken(token) } });
    if (!record || record.type !== type || record.usedAt || record.expiresAt < new Date()) {
      throw new BadRequestException({
        code: 'ENLACE_INVALIDO',
        message: 'El enlace no es válido o ya venció. Pedí uno nuevo.',
      });
    }
    // updateMany con usedAt null evita que dos pedidos simultáneos usen el mismo token.
    const { count } = await this.prisma.authToken.updateMany({
      where: { id: record.id, usedAt: null },
      data: { usedAt: new Date() },
    });
    if (count === 0) {
      throw new BadRequestException({ code: 'ENLACE_INVALIDO', message: 'El enlace ya fue usado.' });
    }
    return record;
  }
}
