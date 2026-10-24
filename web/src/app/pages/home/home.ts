import { Component, afterNextRender, inject, signal } from '@angular/core';
import { HealthService } from '../../core/api/health.service';

type Estado = 'verificando' | 'ok' | 'sin-base' | 'sin-api';

@Component({
  selector: 'app-home',
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  private readonly health = inject(HealthService);
  protected readonly estado = signal<Estado>('verificando');

  constructor() {
    // Solo en el navegador: el chequeo no tiene sentido durante el render del servidor.
    afterNextRender(() => this.verificar());
  }

  protected verificar(): void {
    this.estado.set('verificando');
    this.health.check().subscribe({
      next: (r) => this.estado.set(r.db === 'up' ? 'ok' : 'sin-base'),
      error: (e) => this.estado.set(e.status === 503 ? 'sin-base' : 'sin-api'),
    });
  }
}
