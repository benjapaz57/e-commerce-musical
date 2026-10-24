import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe, JsonPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminApi, AuditItem, Page } from '../../core/admin-api.service';
import { readApiError } from '../../core/api/api-error';

@Component({
  selector: 'app-admin-audit',
  imports: [DatePipe, JsonPipe, FormsModule],
  template: `
    <div class="toolbar">
      <div class="field">
        <label for="aa-type">Tipo</label>
        <select id="aa-type" [(ngModel)]="type" (ngModelChange)="load(1)">
          <option value="">Todos</option>
          <option value="usuario">Usuarios</option>
          <option value="categoria">Categorías</option>
          <option value="marca">Marcas</option>
          <option value="ajuste">Configuración</option>
        </select>
      </div>
    </div>
    @if (error()) { <p class="form-error" role="alert">{{ error() }}</p> }
    @if (data(); as d) {
      <div class="table-wrap">
        <table class="table">
          <thead><tr><th>Fecha</th><th>Quién</th><th>Acción</th><th>Motivo</th><th>Detalle</th></tr></thead>
          <tbody>
            @for (a of d.items; track a.id) {
              <tr>
                <td>{{ a.createdAt | date: 'dd/MM/yyyy HH:mm' }}</td>
                <td>{{ a.actor?.displayName ?? 'Sistema' }}</td>
                <td><code>{{ a.action }}</code></td>
                <td>{{ a.reason ?? '—' }}</td>
                <td>
                  <details>
                    <summary>Ver cambios</summary>
                    <pre>Antes: {{ a.before | json }}
Después: {{ a.after | json }}</pre>
                  </details>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="5" class="empty">Todavía no hay acciones registradas.</td></tr>
            }
          </tbody>
        </table>
      </div>
      <div class="pager">
        <span class="muted">{{ d.total }} registros · página {{ d.page }} de {{ d.pages }}</span>
        <div class="actions">
          <button class="btn btn-sm btn-secondary" type="button" [disabled]="d.page <= 1" (click)="load(d.page - 1)">Anterior</button>
          <button class="btn btn-sm btn-secondary" type="button" [disabled]="d.page >= d.pages" (click)="load(d.page + 1)">Siguiente</button>
        </div>
      </div>
    }
  `,
  styles: `
    :host { display: flex; flex-direction: column; gap: var(--space-4); }
    pre { font-size: 0.8125rem; white-space: pre-wrap; word-break: break-word; max-width: 420px; margin: var(--space-2) 0 0; }
  `,
})
export class AdminAudit implements OnInit {
  private readonly api = inject(AdminApi);
  protected readonly data = signal<Page<AuditItem> | null>(null);
  protected readonly error = signal<string | null>(null);
  protected type = '';

  ngOnInit() {
    void this.load(1);
  }

  async load(page: number) {
    try {
      this.data.set(await this.api.audit({ page, entityType: this.type }));
    } catch (e) {
      this.error.set(readApiError(e).message);
    }
  }
}
