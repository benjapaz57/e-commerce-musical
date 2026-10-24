import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="admin">
      <header class="admin-head">
        <h1>Administración</h1>
        <nav class="admin-tabs" aria-label="Secciones de administración">
          @for (s of sections; track s.path) {
            <a [routerLink]="s.path" routerLinkActive="is-active" ariaCurrentWhenActive="page">{{ s.label }}</a>
          }
        </nav>
      </header>
      <router-outlet />
    </div>
  `,
  styleUrl: './admin.scss',
})
export class AdminLayout {
  protected readonly sections = [
    { path: 'usuarios', label: 'Usuarios' },
    { path: 'categorias', label: 'Categorías' },
    { path: 'marcas', label: 'Marcas' },
    { path: 'configuracion', label: 'Configuración' },
    { path: 'auditoria', label: 'Auditoría' },
  ];
}
