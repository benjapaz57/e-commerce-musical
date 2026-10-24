import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class PageQuery {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page = 1;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100)
  pageSize = 20;
}

export const paged = <T>(items: T[], total: number, q: PageQuery) => ({
  items,
  total,
  page: q.page,
  pageSize: q.pageSize,
  pages: Math.max(1, Math.ceil(total / q.pageSize)),
});
