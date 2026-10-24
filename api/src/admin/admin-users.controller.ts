import { Body, Controller, Get, NotFoundException, Param, ParseUUIDPipe, Patch, Query, BadRequestException, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import { AdminGuard } from '../auth/admin.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { Prisma, UserStatus, type User } from '../generated/prisma/client.js';
import { paged } from '../common/pagination.js';
import { ChangeStatusDto, UsersQuery } from './dto/admin.dto.js';

const userSelect = {
  id: true,
  email: true,
  displayName: true,
  province: true,
  city: true,
  role: true,
  status: true,
  emailVerifiedAt: true,
  createdAt: true,
  sellerProfile: { select: { accountType: true, status: true } },
  _count: { select: { listings: true, reportsReceived: true } },
} satisfies Prisma.UserSelect;

@Controller('admin/users')
@UseGuards(AdminGuard)
export class AdminUsersController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  async list(@Query() q: UsersQuery) {
    const where: Prisma.UserWhereInput = {
      ...(q.status ? { status: q.status } : {}),
      ...(q.q
        ? { OR: [{ email: { contains: q.q, mode: 'insensitive' } }, { displayName: { contains: q.q, mode: 'insensitive' } }] }
        : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({ where, select: userSelect, orderBy: { createdAt: 'desc' }, skip: (q.page - 1) * q.pageSize, take: q.pageSize }),
      this.prisma.user.count({ where }),
    ]);
    return paged(items, total, q);
  }

  @Get(':id')
  async detail(@Param('id', ParseUUIDPipe) id: string) {
    const user = await this.prisma.user.findUnique({ where: { id }, select: userSelect });
    if (!user) throw new NotFoundException('Usuario no encontrado.');
    return user;
  }

  // Suspender o reactivar (RF-9.1). Suspender cierra todas sus sesiones.
  @Patch(':id/status')
  async changeStatus(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ChangeStatusDto, @CurrentUser() admin: User) {
    if (id === admin.id) throw new BadRequestException('No podés cambiar el estado de tu propia cuenta.');
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado.');
    if (user.status === UserStatus.ELIMINADO) throw new BadRequestException('La cuenta fue eliminada por su titular.');
    if (user.status === dto.status) return this.detail(id);

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id },
        data: { status: dto.status, ...(dto.status === UserStatus.SUSPENDIDO ? { sessionVersion: { increment: 1 } } : {}) },
      });
      await this.audit.log(
        {
          actorId: admin.id,
          action: dto.status === UserStatus.SUSPENDIDO ? 'usuario.suspender' : 'usuario.reactivar',
          entityType: 'usuario',
          entityId: id,
          before: { status: user.status },
          after: { status: dto.status },
          reason: dto.reason,
        },
        tx,
      );
    });
    return this.detail(id);
  }
}
