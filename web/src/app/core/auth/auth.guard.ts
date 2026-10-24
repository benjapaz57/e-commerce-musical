import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

// Las dependencias se inyectan antes del await: inject() no funciona después.

// Rutas que exigen sesión: si no hay, manda a ingresar y luego vuelve.
export const authGuard: CanActivateFn = async (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.load();
  return auth.isLoggedIn() ? true : router.createUrlTree(['/ingresar'], { queryParams: { volver: state.url } });
};

// Rutas solo para visitantes (ingresar, registro): si ya hay sesión, va al perfil.
export const guestGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.load();
  return auth.isLoggedIn() ? router.createUrlTree(['/perfil']) : true;
};

// Rutas de administración: exige sesión y rol ADMIN.
export const adminGuard: CanActivateFn = async (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.load();
  if (!auth.isLoggedIn()) return router.createUrlTree(['/ingresar'], { queryParams: { volver: state.url } });
  return auth.user()?.role === 'ADMIN' ? true : router.createUrlTree(['/']);
};
