import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import { Prisma } from '../generated/prisma/client.js';
import { SETTINGS } from './settings.definitions.js';

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // Valor vigente de un ajuste; si no está en la base, el valor por defecto.
  async get<T>(key: string): Promise<T> {
    const def = SETTINGS[key];
    if (!def) throw new NotFoundException(`Ajuste desconocido: ${key}`);
    const row = await this.prisma.appSetting.findUnique({ where: { key } });
    return (row?.value ?? def.defaultValue) as T;
  }

  async list() {
    const rows = await this.prisma.appSetting.findMany();
    const byKey = new Map(rows.map((r) => [r.key, r]));
    return Object.entries(SETTINGS).map(([key, def]) => ({
      key,
      label: def.label,
      description: def.description,
      value: byKey.get(key)?.value ?? def.defaultValue,
      updatedAt: byKey.get(key)?.updatedAt ?? null,
    }));
  }

  async update(key: string, value: unknown, actorId: string, reason?: string) {
    const def = SETTINGS[key];
    if (!def) throw new NotFoundException(`Ajuste desconocido: ${key}`);
    const error = def.validate(value);
    if (error) throw new BadRequestException(error);

    const before = await this.get(key);
    return this.prisma.$transaction(async (tx) => {
      const saved = await tx.appSetting.upsert({
        where: { key },
        update: { value: value as Prisma.InputJsonValue, updatedById: actorId },
        create: { key, value: value as Prisma.InputJsonValue, updatedById: actorId },
      });
      await this.audit.log({ actorId, action: 'ajuste.modificar', entityType: 'ajuste', entityId: key, before, after: value, reason }, tx);
      return saved;
    });
  }
}
