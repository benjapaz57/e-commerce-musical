import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsDefined, IsIn, IsInt, IsOptional, IsString, IsUUID, Length, MaxLength, Min, ValidateIf } from 'class-validator';
import { PageQuery } from '../../common/pagination.js';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class UsersQuery extends PageQuery {
  @IsOptional() @Transform(trim) @IsString() @MaxLength(100)
  q?: string;

  @IsOptional() @IsIn(['ACTIVO', 'SUSPENDIDO', 'ELIMINADO'])
  status?: 'ACTIVO' | 'SUSPENDIDO' | 'ELIMINADO';
}

export class ChangeStatusDto {
  @IsIn(['ACTIVO', 'SUSPENDIDO'], { message: 'El estado debe ser ACTIVO o SUSPENDIDO.' })
  status: 'ACTIVO' | 'SUSPENDIDO';

  @Transform(trim)
  @IsString({ message: 'Indicá el motivo (entre 3 y 500 caracteres).' })
  @Length(3, 500, { message: 'Indicá el motivo (entre 3 y 500 caracteres).' })
  reason: string;
}

export class CreateCategoryDto {
  @Transform(trim) @IsString() @Length(2, 60, { message: 'El nombre debe tener entre 2 y 60 caracteres.' })
  name: string;

  @IsOptional() @ValidateIf((_o, v) => v !== null) @IsUUID()
  parentId?: string | null;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  order?: number;
}

export class UpdateCategoryDto {
  @IsOptional() @Transform(trim) @IsString() @Length(2, 60, { message: 'El nombre debe tener entre 2 y 60 caracteres.' })
  name?: string;

  @IsOptional() @ValidateIf((_o, v) => v !== null) @IsUUID()
  parentId?: string | null;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  order?: number;

  @IsOptional() @IsBoolean()
  active?: boolean;
}

export class CreateBrandDto {
  @Transform(trim) @IsString() @Length(1, 60, { message: 'El nombre debe tener entre 1 y 60 caracteres.' })
  name: string;
}

export class UpdateBrandDto {
  @IsOptional() @Transform(trim) @IsString() @Length(1, 60)
  name?: string;

  @IsOptional() @IsBoolean()
  active?: boolean;
}

export class UpdateSettingDto {
  // El contenido se valida según la definición de cada ajuste.
  @IsDefined({ message: 'Falta el valor del ajuste.' })
  value: unknown;

  @IsOptional() @Transform(trim) @IsString() @MaxLength(500)
  reason?: string;
}

export class AuditQuery extends PageQuery {
  @IsOptional() @IsString() @MaxLength(50)
  entityType?: string;
}
