import type { CookieOptions } from 'express';

export function sessionCookieOptions(days: number, production: boolean): CookieOptions {
  return {
    httpOnly: true, // el JavaScript del navegador no puede leerla
    secure: production, // solo HTTPS en producción
    sameSite: 'lax',
    path: '/',
    maxAge: days * 24 * 60 * 60 * 1000,
  };
}
