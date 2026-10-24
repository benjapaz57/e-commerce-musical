import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Pantallas de cuenta: dependen de la sesión del navegador, se renderizan en el cliente.
  { path: 'registro', renderMode: RenderMode.Client },
  { path: 'ingresar', renderMode: RenderMode.Client },
  { path: 'verificar-email', renderMode: RenderMode.Client },
  { path: 'recuperar', renderMode: RenderMode.Client },
  { path: 'restablecer', renderMode: RenderMode.Client },
  { path: 'perfil', renderMode: RenderMode.Client },
  { path: 'admin/**', renderMode: RenderMode.Client },
  { path: 'admin', renderMode: RenderMode.Client },
  // Resto (inicio y, más adelante, publicaciones): render en el servidor para SEO.
  { path: '**', renderMode: RenderMode.Server },
];
