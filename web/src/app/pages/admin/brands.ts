import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminApi, AdminBrand } from '../../core/admin-api.service';
import { readApiError } from '../../core/api/api-error';

@Component({
  selector: 'app-admin-brands',
  imports: [FormsModule],
  template: `
    @if (error()) { <p class="form-error" role="alert">{{ error() }}</p> }
    @if (notice()) { <p class="form-success" role="status">{{ notice() }}</p> }

    <div class="toolbar">
      <div class="field">
        <label for="ab-filter">Filtrar</label>
        <input id="ab-filter" [ngModel]="filter()" (ngModelChange)="filter.set($event)" placeholder="Nombre de la marca" />
      </div>
      <form class="inline-form" (ngSubmit)="create()">
        <input name="newBrand" [(ngModel)]="newBrand" placeholder="Nueva marca" aria-label="Nueva marca" />
        <button class="btn btn-sm btn-primary" type="submit" [disabled]="!newBrand.trim()">Agregar marca</button>
      </form>
    </div>

    <div class="table-wrap">
      <table class="table">
        <thead><tr><th>Marca</th><th>Publicaciones</th><th>Activa</th></tr></thead>
        <tbody>
          @for (b of visible(); track b.id) {
            <tr>
              <td><input [value]="b.name" (change)="rename(b, $any($event.target).value)" [attr.aria-label]="'Nombre de ' + b.name" /></td>
              <td>{{ b._count.listings }}</td>
              <td><label class="checkbox"><input type="checkbox" [checked]="b.active" (change)="toggle(b)" /> {{ b.active ? 'Sí' : 'No' }}</label></td>
            </tr>
          } @empty {
            <tr><td colspan="3" class="empty">Ninguna marca coincide con el filtro.</td></tr>
          }
        </tbody>
      </table>
    </div>
  `,
  styles: `:host { display: flex; flex-direction: column; gap: var(--space-4); } td input { min-height: 38px; }`,
})
export class AdminBrands implements OnInit {
  private readonly api = inject(AdminApi);
  protected readonly brands = signal<AdminBrand[]>([]);
  protected readonly filter = signal('');
  protected readonly visible = computed(() => {
    const f = this.filter().trim().toLowerCase();
    return f ? this.brands().filter((b) => b.name.toLowerCase().includes(f)) : this.brands();
  });
  protected readonly error = signal<string | null>(null);
  protected readonly notice = signal<string | null>(null);
  protected newBrand = '';

  ngOnInit() {
    void this.reload();
  }

  private async reload() {
    try {
      this.brands.set(await this.api.brands());
    } catch (e) {
      this.error.set(readApiError(e).message);
    }
  }

  private async run(action: () => Promise<unknown>, done: string) {
    this.error.set(null);
    this.notice.set(null);
    try {
      await action();
      this.notice.set(done);
    } catch (e) {
      this.error.set(readApiError(e).message);
    }
    await this.reload();
  }

  create() {
    const n = this.newBrand.trim();
    void this.run(() => this.api.createBrand(n), `Marca "${n}" agregada.`).then(() => (this.newBrand = ''));
  }

  rename(b: AdminBrand, name: string) {
    const n = name.trim();
    if (!n || n === b.name) return;
    void this.run(() => this.api.updateBrand(b.id, { name: n }), `Renombrada a "${n}".`);
  }

  toggle(b: AdminBrand) {
    void this.run(() => this.api.updateBrand(b.id, { active: !b.active }), `"${b.name}" ${b.active ? 'desactivada' : 'activada'}.`);
  }
}
