import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Role } from '../generated/prisma/client.js';
import { SessionGuard, type AuthedRequest } from './session.guard.js';

// Exige sesión válida y rol ADMIN. Uso: @UseGuards(AdminGuard)
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly session: SessionGuard) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    await this.session.canActivate(context);
    const { user } = context.switchToHttp().getRequest<AuthedRequest>();
    if (user.role !== Role.ADMIN) throw new ForbiddenException('No tenés permisos de administración.');
    return true;
  }
}
