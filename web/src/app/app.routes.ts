import { Routes } from '@angular/router';
import { adminGuard, authGuard, guestGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/home/home').then((m) => m.Home) },
  {
    path: 'registro',
    canActivate: [guestGuard],
    title: 'Crear cuenta',
    loadComponent: () => import('./pages/auth/register').then((m) => m.Register),
  },
  {
    path: 'ingresar',
    canActivate: [guestGuard],
    title: 'Ingresar',
    loadComponent: () => import('./pages/auth/login').then((m) => m.Login),
  },
  {
    path: 'verificar-email',
    title: 'Confirmar email',
    loadComponent: () => import('./pages/auth/verify-email').then((m) => m.VerifyEmail),
  },
  {
    path: 'recuperar',
    title: 'Recuperar contraseña',
    loadComponent: () => import('./pages/auth/forgot-password').then((m) => m.ForgotPassword),
  },
  {
    path: 'restablecer',
    title: 'Nueva contraseña',
    loadComponent: () => import('./pages/auth/reset-password').then((m) => m.ResetPassword),
  },
  {
    path: 'perfil',
    canActivate: [authGuard],
    title: 'Mi perfil',
    loadComponent: () => import('./pages/profile/profile').then((m) => m.Profile),
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    title: 'Administración',
    loadComponent: () => import('./pages/admin/admin-layout').then((m) => m.AdminLayout),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'usuarios' },
      { path: 'usuarios', loadComponent: () => import('./pages/admin/users').then((m) => m.AdminUsers) },
      { path: 'categorias', loadComponent: () => import('./pages/admin/categories').then((m) => m.AdminCategories) },
      { path: 'marcas', loadComponent: () => import('./pages/admin/brands').then((m) => m.AdminBrands) },
      { path: 'configuracion', loadComponent: () => import('./pages/admin/settings').then((m) => m.AdminSettings) },
      { path: 'auditoria', loadComponent: () => import('./pages/admin/audit').then((m) => m.AdminAudit) },
    ],
  },
  { path: '**', redirectTo: '' },
];
