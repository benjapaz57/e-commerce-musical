import { Body, Controller, Delete, HttpCode, Patch, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { verify } from '@node-rs/argon2';
import type { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service.js';
import { ListingStatus, UserStatus, type User } from '../generated/prisma/client.js';
import { SessionGuard } from '../auth/session.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { toPublicUser } from '../auth/public-user.js';
import { SESSION_COOKIE } from '../auth/auth.constants.js';
import { DeleteAccountDto, UpdateProfileDto } from './dto/users.dto.js';

@Controller('users')
@UseGuards(SessionGuard)
export class UsersController {
  constructor(private readonly prisma: PrismaService) {}

  @Patch('me')
  async update(@CurrentUser() user: User, @Body() dto: UpdateProfileDto) {
    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: { displayName: dto.displayName, province: dto.province, city: dto.city },
    });
    return toPublicUser(updated);
  }

  // Baja de cuenta (RF-1.4): pausa publicaciones, anonimiza el perfil y cierra sesiones.
  @Delete('me')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async remove(
    @CurrentUser() user: User,
    @Body() dto: DeleteAccountDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!(await verify(user.passwordHash, dto.password))) {
      throw new UnauthorizedException('La contraseña no es correcta.');
    }
    await this.prisma.$transaction([
      this.prisma.listing.updateMany({
        where: { sellerId: user.id, status: { in: [ListingStatus.ACTIVA, ListingStatus.RESERVADA] } },
        data: { status: ListingStatus.PAUSADA },
      }),
      this.prisma.user.update({
        where: { id: user.id },
        data: {
          status: UserStatus.ELIMINADO,
          deletedAt: new Date(),
          email: `eliminado-${user.id}@cuenta-eliminada.invalid`, // libera el email para una cuenta nueva
          displayName: 'Usuario eliminado',
          avatarUrl: null,
          city: null,
          province: null,
          sessionVersion: { increment: 1 },
        },
      }),
    ]);
    res.clearCookie(SESSION_COOKIE, { path: '/' });
    return { message: 'Tu cuenta fue eliminada.' };
  }
}
