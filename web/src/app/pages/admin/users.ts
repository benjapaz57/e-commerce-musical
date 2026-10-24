import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminApi, AdminUser, Page } from '../../core/admin-api.service';
import { AuthService } from '../../core/auth/auth.service';
import { readApiError } from '../../core/api/api-error';

@Component({
  selector: 'app-admin-users',
  imports: [FormsModule, DatePipe],
  template: `
    <form class="toolbar" (ngSubmit)="load(1)">
      <div class="field">
        <label for="au-q">Buscar</label>
        <input id="au-q" name="q" [(ngModel)]="q" placeholder="Email o nombre" />
      </div>
      <div class="field">
        <label for="au-status">Estado</label>
        <select id="au-status" name="status" [(ngModel)]="status" (ngModelChange)="load(1)">
          <option value="">Todos</option>
          <option value="ACTIVO">Activos</option>
          <option value="SUSPENDIDO">Suspendidos</option>
          <option value="ELIMINADO">Eliminados</option>
        </select>
      </div>
      <button class="btn btn-secondary" type="submit">Buscar</button>
    </form>

    @if (error()) { <p class="form-error" role="alert">{{ error() }}</p> }

    @if (data(); as d) {
      @if (d.items.length === 0) {
        <p class="empty">No hay usuarios que coincidan con la búsqueda.</p>
      } @else {
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr><th>Usuario</th><th>Estado</th><th>Vendedor</th><th>Alta</th><th>Acción</th></tr>
            </thead>
            <tbody>
              @for (u of d.items; track u.id) {
                <tr>
                  <td>
                    <strong>{{ u.displayName }}</strong>
                    @if (u.role === 'ADMIN') { <span class="pill">Admin</span> }
                    <br /><span class="muted">{{ u.email }}</span>
                    @if (!u.emailVerifiedAt) { <br /><span class="muted">Email sin confirmar</span> }
                  </td>
                  <td>
                    <span class="pill" [class.pill-ok]="u.status === 'ACTIVO'" [class.pill-error]="u.status === 'SUSPENDIDO'">
                      {{ statusLabel[u.status] }}
                    </span>
                  </td>
                  <td>{{ u.sellerProfile ? u.sellerProfile.status : '—' }}</td>
                  <td>{{ u.createdAt | date: 'dd/MM/yyyy' }}</td>
                  <td>
                    @if (u.status !== 'ELIMINADO' && u.id !== auth.user()?.id) {
                      @if (editing() === u.id) {
                        <form class="inline-form" (ngSubmit)="apply(u)">
                          <input name="reason" [(ngModel)]="reason" placeholder="Motivo (queda en auditoría)" [attr.aria-label]="'Motivo para ' + u.displayName" />
                          <button class="btn btn-sm" [class.btn-danger]="u.status === 'ACTIVO'" [class.btn-primary]="u.status !== 'ACTIVO'" type="submit" [disabled]="reason.trim().length < 3">
                            Confirmar
                          </button>
                          <button class="btn btn-sm btn-secondary" type="button" (click)="editing.set(null)">Cancelar</button>
                        </form>
                      } @else {
                        <button class="btn btn-sm btn-secondary" type="button" (click)="startEdit(u.id)">
                          {{ u.status === 'ACTIVO' ? 'Suspender' : 'Reactivar' }}
                        </button>
                      }
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <div class="pager">
          <span class="muted">{{ d.total }} usuarios · página {{ d.page }} de {{ d.pages }}</span>
          <div class="actions">
            <button class="btn btn-sm btn-secondary" type="button" [disabled]="d.page <= 1" (click)="load(d.page - 1)">Anterior</button>
            <button class="btn btn-sm btn-secondary" type="button" [disabled]="d.page >= d.pages" (click)="load(d.page + 1)">Siguiente</button>
          </div>
        </div>
      }
    } @else if (!error()) {
      <p class="muted">Cargando…</p>
    }
  `,
  styles: `:host { display: flex; flex-direction: column; gap: var(--space-4); }`,
})
export class AdminUsers implements OnInit {
  private readonly api = inject(AdminApi);
  protected readonly auth = inject(AuthService);
  protected readonly data = signal<Page<AdminUser> | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly editing = signal<string | null>(null);
  protected q = '';
  protected status = '';
  protected reason = '';
  protected readonly statusLabel = { ACTIVO: 'Activo', SUSPENDIDO: 'Suspendido', ELIMINADO: 'Eliminado' };

  ngOnInit() {
    void this.load(1);
  }

  async load(page: number) {
    this.error.set(null);
    try {
      this.data.set(await this.api.users({ q: this.q.trim(), status: this.status, page }));
    } catch (e) {
      this.error.set(readApiError(e).message);
    }
  }

  startEdit(id: string) {
    this.reason = '';
    this.editing.set(id);
  }

  async apply(u: AdminUser) {
    try {
      await this.api.setUserStatus(u.id, u.status === 'ACTIVO' ? 'SUSPENDIDO' : 'ACTIVO', this.reason.trim());
      this.editing.set(null);
      await this.load(this.data()?.page ?? 1);
    } catch (e) {
      this.error.set(readApiError(e).message);
    }
  }
}
