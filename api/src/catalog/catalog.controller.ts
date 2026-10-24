import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

// Catálogo público: categorías y marcas activas, para formularios y filtros.
@Controller()
export class CatalogController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('categories')
  async categories() {
    const all = await this.prisma.category.findMany({
      where: { active: true },
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
      select: { id: true, name: true, slug: true, parentId: true },
    });
    return all
      .filter((c) => c.parentId === null)
      .map((p) => ({ ...p, children: all.filter((c) => c.parentId === p.id) }));
  }

  @Get('brands')
  brands() {
    return this.prisma.brand.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, slug: true },
    });
  }
}
