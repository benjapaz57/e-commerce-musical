import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthedRequest } from './session.guard.js';

// Inyecta el usuario de la sesión en un handler protegido por SessionGuard.
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => ctx.switchToHttp().getRequest<AuthedRequest>().user,
);
