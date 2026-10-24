import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminApi, AdminSetting } from '../../core/admin-api.service';
import { readApiError } from '../../core/api/api-error';

const DOLLAR_KINDS = [
  { value: 'blue', label: 'Blue' },
  { value: 'oficial', label: 'Oficial' },
  { value: 'bolsa', label: 'MEP (bolsa)' },
  { value: 'contadoconliqui', label: 'Contado con liquidación' },
  { value: 'mayorista', label: 'Mayorista' },
  { value: 'tarjeta', label: 'Tarjeta' },
  { value: 'cripto', label: 'Cripto' },
];

@Component({
  selector: 'app-admin-settings',
  imports: [FormsModule, DatePipe],
  template: `
    @for (s of settings(); track s.key) {
      <section class="panel">
        <h2>{{ s.label }}</h2>
        <p class="muted">{{ s.description }}</p>
        @if (s.updatedAt) { <p class="hint">Última modificación: {{ s.updatedAt | date: 'dd/MM/yyyy HH:mm' }}</p> }

        <form (ngSubmit)="save(s)">
          @switch (s.key) {
            @case ('planes') {
              @for (plan of ['inicial', 'completo']; track plan) {
                <fieldset class="field-row">
                  <legend>Plan {{ plan === 'inicial' ? 'Inicial' : 'Completo' }}</legend>
                  <div class="field">
                    <label [for]="'p-' + plan + '-usd'">Precio (USD, pago único)</label>
                    <input [id]="'p-' + plan + '-usd'" type="number" min="0.01" step="0.01" [name]="plan + 'usd'" [(ngModel)]="draft[s.key][plan].amountUsd" />
                  </div>
                  <div class="field">
                    <label [for]="'p-' + plan + '-max'">Publicaciones activas a la vez</label>
                    <input [id]="'p-' + plan + '-max'" type="number" min="1" step="1" [name]="plan + 'max'" [(ngModel)]="draft[s.key][plan].maxActive" />
                  </div>
                </fieldset>
              }
            }
            @case ('cotizacion') {
              <div class="field-row">
                <div class="field">
                  <label for="c-kind">Tipo de dólar</label>
                  <select id="c-kind" name="kind" [(ngModel)]="draft[s.key].kind">
                    @for (k of dollarKinds; track k.value) { <option [value]="k.value">{{ k.label }}</option> }
                  </select>
                </div>
                <div class="field">
                  <label for="c-min">Actualizar cada (minutos)</label>
                  <input id="c-min" type="number" min="5" max="1440" name="refresh" [(ngModel)]="draft[s.key].refreshMinutes" />
                </div>
              </div>
              <p class="hint">Fuente: DolarAPI.</p>
            }
            @case ('limitesCuentasNuevas') {
              <div class="field-row">
                <div class="field">
                  <label for="l-dias">Días que una cuenta se considera nueva</label>
                  <input id="l-dias" type="number" min="1" max="365" name="dias" [(ngModel)]="draft[s.key].diasCuentaNueva" />
                </div>
                <div class="field">
                  <label for="l-conv">Conversaciones nuevas por día</label>
                  <input id="l-conv" type="number" min="1" name="conv" [(ngModel)]="draft[s.key].conversacionesPorDia" />
                </div>
              </div>
            }
          }
          <div class="field">
            <label [for]="'r-' + s.key">Motivo del cambio (opcional, queda en auditoría)</label>
            <input [id]="'r-' + s.key" [name]="'reason-' + s.key" [(ngModel)]="reasons[s.key]" />
          </div>
          @if (errors()[s.key]) { <p class="form-error" role="alert">{{ errors()[s.key] }}</p> }
          @if (saved() === s.key) { <p class="form-success" role="status">Guardado.</p> }
          <button class="btn btn-primary" type="submit">Guardar</button>
        </form>
      </section>
    }
  `,
  styles: `
    :host { display: flex; flex-direction: column; gap: var(--space-4); }
    fieldset { border: 1px solid var(--color-border); border-radius: var(--radius-sm); padding: var(--space-3); margin: 0; }
    legend { font-weight: 700; padding: 0 var(--space-1); }
  `,
})
export class AdminSettings implements OnInit {
  private readonly api = inject(AdminApi);
  protected readonly settings = signal<AdminSetting[]>([]);
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly saved = signal<string | null>(null);
  protected readonly dollarKinds = DOLLAR_KINDS;
  protected draft: Record<string, any> = {};
  protected reasons: Record<string, string> = {};

  ngOnInit() {
    void this.reload();
  }

  private async reload() {
    const list = await this.api.settings();
    this.draft = Object.fromEntries(list.map((s) => [s.key, structuredClone(s.value)]));
    this.settings.set(list);
  }

  async save(s: AdminSetting) {
    this.saved.set(null);
    this.errors.update((e) => ({ ...e, [s.key]: '' }));
    try {
      await this.api.updateSetting(s.key, this.draft[s.key], this.reasons[s.key]?.trim() || undefined);
      this.reasons[s.key] = '';
      await this.reload();
      this.saved.set(s.key);
    } catch (e) {
      this.errors.update((x) => ({ ...x, [s.key]: readApiError(e).message }));
    }
  }
}
