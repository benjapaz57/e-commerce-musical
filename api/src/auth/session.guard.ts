import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import type { User } from '../generated/prisma/client.js';
import { AuthService } from './auth.service.js';
import { SESSION_COOKIE } from './auth.constants.js';

export type AuthedRequest = Request & { user: User };

// Exige una sesión válida. Uso: @UseGuards(SessionGuard)
@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthedRequest>();
    const token: unknown = req.cookies?.[SESSION_COOKIE];
    const user = typeof token === 'string' ? await this.auth.validateSession(token) : null;
    if (!user) throw new UnauthorizedException('Tenés que ingresar para continuar.');
    req.user = user;
    return true;
  }
}
