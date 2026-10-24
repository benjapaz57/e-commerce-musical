import { BadRequestException, Body, ConflictException, Controller, Get, NotFoundException, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import { AdminGuard } from '../auth/admin.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { User } from '../generated/prisma/client.js';
import { slugify } from '../common/slug.js';
import { CreateBrandDto, CreateCategoryDto, UpdateBrandDto, UpdateCategoryDto } from './dto/admin.dto.js';

// Categorías y marcas (RF-9.5). No se borran: se desactivan (baja lógica) para no romper publicaciones.
@Controller('admin')
@UseGuards(AdminGuard)
export class AdminCatalogController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // ───────────── Categorías ─────────────

  @Get('categories')
  async categories() {
    const all = await this.prisma.category.findMany({
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { listings: true } } },
    });
    return all.filter((c) => !c.parentId).map((p) => ({ ...p, children: all.filter((c) => c.parentId === p.id) }));
  }

  @Post('categories')
  async createCategory(@Body() dto: CreateCategoryDto, @CurrentUser() admin: User) {
    if (dto.parentId) await this.assertCanBeParent(dto.parentId);
    const slug = await this.uniqueSlug(dto.name, 'category');
    return this.prisma.$transaction(async (tx) => {
      const created = await tx.category.create({ data: { name: dto.name, slug, parentId: dto.parentId ?? null, order: dto.order ?? 0 } });
      await this.audit.log({ actorId: admin.id, action: 'categoria.crear', entityType: 'categoria', entityId: created.id, after: created }, tx);
      return created;
    });
  }

  @Patch('categories/:id')
  async updateCategory(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCategoryDto, @CurrentUser() admin: User) {
    const before = await this.prisma.category.findUnique({ where: { id }, include: { _count: { select: { children: true } } } });
    if (!before) throw new NotFoundException('Categoría no encontrada.');
    if (dto.parentId) {
      if (dto.parentId === id) throw new BadRequestException('Una categoría no puede ser su propia madre.');
      if (before._count.children > 0) throw new BadRequestException('Una categoría con subcategorías no puede pasar a ser subcategoría.');
      await this.assertCanBeParent(dto.parentId);
    }
    const { _count, ...prev } = before;
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.category.update({
        where: { id },
        data: { name: dto.name, parentId: dto.parentId, order: dto.order, active: dto.active },
      });
      await this.audit.log({ actorId: admin.id, action: 'categoria.modificar', entityType: 'categoria', entityId: id, before: prev, after: updated }, tx);
      return updated;
    });
  }

  // Solo se permiten dos niveles: categoría y subcategoría.
  private async assertCanBeParent(parentId: string) {
    const parent = await this.prisma.category.findUnique({ where: { id: parentId } });
    if (!parent) throw new BadRequestException('La categoría madre no existe.');
    if (parent.parentId) throw new BadRequestException('Solo hay dos niveles: elegí una categoría principal como madre.');
  }

  // ───────────── Marcas ─────────────

  @Get('brands')
  brands() {
    return this.prisma.brand.findMany({ orderBy: { name: 'asc' }, include: { _count: { select: { listings: true } } } });
  }

  @Post('brands')
  async createBrand(@Body() dto: CreateBrandDto, @CurrentUser() admin: User) {
    const exists = await this.prisma.brand.findFirst({ where: { name: { equals: dto.name, mode: 'insensitive' } } });
    if (exists) throw new ConflictException('Ya existe una marca con ese nombre.');
    const slug = await this.uniqueSlug(dto.name, 'brand');
    return this.prisma.$transaction(async (tx) => {
      const created = await tx.brand.create({ data: { name: dto.name, slug } });
      await this.audit.log({ actorId: admin.id, action: 'marca.crear', entityType: 'marca', entityId: created.id, after: created }, tx);
      return created;
    });
  }

  @Patch('brands/:id')
  async updateBrand(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateBrandDto, @CurrentUser() admin: User) {
    const before = await this.prisma.brand.findUnique({ where: { id } });
    if (!before) throw new NotFoundException('Marca no encontrada.');
    if (dto.name && dto.name.toLowerCase() !== before.name.toLowerCase()) {
      const exists = await this.prisma.brand.findFirst({ where: { name: { equals: dto.name, mode: 'insensitive' }, NOT: { id } } });
      if (exists) throw new ConflictException('Ya existe una marca con ese nombre.');
    }
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.brand.update({ where: { id }, data: { name: dto.name, active: dto.active } });
      await this.audit.log({ actorId: admin.id, action: 'marca.modificar', entityType: 'marca', entityId: id, before, after: updated }, tx);
      return updated;
    });
  }

  private async uniqueSlug(name: string, model: 'category' | 'brand'): Promise<string> {
    const base = slugify(name) || 'item';
    for (let i = 0; ; i++) {
      const slug = i === 0 ? base : `${base}-${i + 1}`;
      const taken =
        model === 'category'
          ? await this.prisma.category.findUnique({ where: { slug } })
          : await this.prisma.brand.findUnique({ where: { slug } });
      if (!taken) return slug;
    }
  }
}
