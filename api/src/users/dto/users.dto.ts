import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, Length, MaxLength } from 'class-validator';
import { PROVINCIAS } from '../../common/provinces.js';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class UpdateProfileDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @Length(2, 40, { message: 'El nombre debe tener entre 2 y 40 caracteres.' })
  displayName?: string;

  @IsOptional()
  @IsIn(PROVINCIAS, { message: 'Elegí una provincia de la lista.' })
  province?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @Length(2, 80, { message: 'La localidad debe tener entre 2 y 80 caracteres.' })
  city?: string;
}

export class DeleteAccountDto {
  @IsString()
  @MaxLength(128)
  password: string;
}
