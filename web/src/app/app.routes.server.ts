import { RenderMode, ServerRoute } from '@angular/ssr';

// Render en el servidor por pedido: las publicaciones cambian todo el tiempo.
export const serverRoutes: ServerRoute[] = [
  {
    path: '**',
    renderMode: RenderMode.Server,
  },
];
