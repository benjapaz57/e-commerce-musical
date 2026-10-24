import { Transform } from 'class-transformer';
import { IsEmail, IsString, Length, MaxLength, MinLength } from 'class-validator';

const normalizeEmail = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

export class RegisterDto {
  @Transform(normalizeEmail)
  @IsEmail({}, { message: 'Ingresá un email válido.' })
  @MaxLength(254)
  email: string;

  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres.' })
  @MaxLength(128, { message: 'La contraseña no puede superar los 128 caracteres.' })
  password: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(2, 40, { message: 'El nombre debe tener entre 2 y 40 caracteres.' })
  displayName: string;
}

export class LoginDto {
  @Transform(normalizeEmail)
  @IsEmail({}, { message: 'Ingresá un email válido.' })
  email: string;

  @IsString()
  @MaxLength(128)
  password: string;
}

export class EmailDto {
  @Transform(normalizeEmail)
  @IsEmail({}, { message: 'Ingresá un email válido.' })
  email: string;
}

export class TokenDto {
  @IsString()
  @Length(20, 200, { message: 'El enlace no es válido.' })
  token: string;
}

export class ResetPasswordDto extends TokenDto {
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres.' })
  @MaxLength(128, { message: 'La contraseña no puede superar los 128 caracteres.' })
  password: string;
}
