import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminApi, AdminCategory } from '../../core/admin-api.service';
import { readApiError } from '../../core/api/api-error';

@Component({
  selector: 'app-admin-categories',
  imports: [FormsModule],
  template: `
    <p class="muted">Las categorías no se borran: al desactivarlas dejan de ofrecerse para publicar, pero las publicaciones existentes no se rompen.</p>
    @if (error()) { <p class="form-error" role="alert">{{ error() }}</p> }
    @if (notice()) { <p class="form-success" role="status">{{ notice() }}</p> }

    <form class="inline-form" (ngSubmit)="create(null, newRoot)">
      <input name="newRoot" [(ngModel)]="newRoot" placeholder="Nueva categoría principal" aria-label="Nueva categoría principal" />
      <button class="btn btn-sm btn-primary" type="submit" [disabled]="newRoot.trim().length < 2">Agregar categoría</button>
    </form>

    <div class="cat-list">
      @for (c of tree(); track c.id) {
        <section class="panel cat" [class.is-off]="!c.active">
          <div class="cat-row">
            <input class="cat-name" [value]="c.name" (change)="rename(c, $any($event.target).value)" [attr.aria-label]="'Nombre de ' + c.name" />
            <span class="muted">{{ c._count?.listings ?? 0 }} publ.</span>
            <label class="checkbox"><input type="checkbox" [checked]="c.active" (change)="toggle(c)" /> Activa</label>
          </div>
          <ul class="sub-list">
            @for (s of c.children; track s.id) {
              <li class="cat-row" [class.is-off]="!s.active">
                <input class="cat-name" [value]="s.name" (change)="rename(s, $any($event.target).value)" [attr.aria-label]="'Nombre de ' + s.name" />
                <span class="muted">{{ s._count?.listings ?? 0 }} publ.</span>
                <label class="checkbox"><input type="checkbox" [checked]="s.active" (change)="toggle(s)" /> Activa</label>
              </li>
            }
          </ul>
          <form class="inline-form" (ngSubmit)="create(c.id, newSub[c.id])">
            <input [name]="'sub-' + c.id" [(ngModel)]="newSub[c.id]" placeholder="Nueva subcategoría" [attr.aria-label]="'Nueva subcategoría de ' + c.name" />
            <button class="btn btn-sm btn-secondary" type="submit" [disabled]="(newSub[c.id] ?? '').trim().length < 2">Agregar</button>
          </form>
        </section>
      }
    </div>
  `,
  styles: `
    :host { display: flex; flex-direction: column; gap: var(--space-4); }
    .cat-list { display: flex; flex-direction: column; gap: var(--space-3); }
    .cat { padding: var(--space-4); }
    .cat-row { display: flex; align-items: center; gap: var(--space-3); flex-wrap: wrap; }
    .cat > .cat-row .cat-name { font-weight: 700; }
    .cat-name { flex: 1 1 200px; min-height: 38px; }
    .sub-list { list-style: none; margin: var(--space-3) 0 0; padding: 0 0 0 var(--space-5); display: flex; flex-direction: column; gap: var(--space-2); }
    .is-off .cat-name { color: var(--color-text-muted); text-decoration: line-through; }
  `,
})
export class AdminCategories implements OnInit {
  private readonly api = inject(AdminApi);
  protected readonly tree = signal<AdminCategory[]>([]);
  protected readonly error = signal<string | null>(null);
  protected readonly notice = signal<string | null>(null);
  protected newRoot = '';
  protected newSub: Record<string, string> = {};

  ngOnInit() {
    void this.reload();
  }

  private async reload() {
    try {
      this.tree.set(await this.api.categories());
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

  create(parentId: string | null, name: string | undefined) {
    const n = (name ?? '').trim();
    void this.run(() => this.api.createCategory({ name: n, parentId }), `Categoría "${n}" creada.`).then(() => {
      if (parentId) this.newSub[parentId] = '';
      else this.newRoot = '';
    });
  }

  rename(c: AdminCategory, name: string) {
    const n = name.trim();
    if (n === c.name) return;
    void this.run(() => this.api.updateCategory(c.id, { name: n }), `Renombrada a "${n}".`);
  }

  toggle(c: AdminCategory) {
    void this.run(() => this.api.updateCategory(c.id, { active: !c.active }), `"${c.name}" ${c.active ? 'desactivada' : 'activada'}.`);
  }
}
