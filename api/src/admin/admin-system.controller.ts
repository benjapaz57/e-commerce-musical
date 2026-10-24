import { Body, Controller, Get, Param, Put, Query, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { SettingsService } from '../settings/settings.service.js';
import { AdminGuard } from '../auth/admin.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { Prisma, User } from '../generated/prisma/client.js';
import { paged } from '../common/pagination.js';
import { AuditQuery, UpdateSettingDto } from './dto/admin.dto.js';

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminSystemController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
  ) {}

  // Configuración editable (RF-9.7)
  @Get('settings')
  list() {
    return this.settings.list();
  }

  @Put('settings/:key')
  update(@Param('key') key: string, @Body() dto: UpdateSettingDto, @CurrentUser() admin: User) {
    return this.settings.update(key, dto.value, admin.id, dto.reason);
  }

  // Registro de auditoría (RF-9.8), más reciente primero.
  @Get('audit')
  async audit(@Query() q: AuditQuery) {
    const where: Prisma.AuditLogWhereInput = q.entityType ? { entityType: q.entityType } : {};
    const [items, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
        include: { actor: { select: { id: true, displayName: true, email: true } } },
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    return paged(items, total, q);
  }
}
