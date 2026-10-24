import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { readApiError } from '../../core/api/api-error';
import { FieldError } from '../../shared/field-error';

const sameAsPassword = (c: AbstractControl): ValidationErrors | null =>
  c.parent && c.value !== c.parent.get('password')?.value ? { mismatch: true } : null;

@Component({
  selector: 'app-reset-password',
  imports: [ReactiveFormsModule, RouterLink, FieldError],
  template: `
    <section class="auth-card">
      @if (done()) {
        <h1>Contraseña actualizada</h1>
        <p>Por seguridad cerramos las sesiones abiertas en otros dispositivos.</p>
        <a class="btn btn-primary" routerLink="/ingresar">Ingresar</a>
      } @else {
        <h1>Elegí una contraseña nueva</h1>
        <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <div class="field">
            <label for="reset-pass">Contraseña nueva</label>
            <input id="reset-pass" type="password" formControlName="password" autocomplete="new-password" />
            <p class="hint">Mínimo 8 caracteres.</p>
            <app-field-error [control]="form.controls.password" />
          </div>
          <div class="field">
            <label for="reset-pass2">Repetí la contraseña</label>
            <input id="reset-pass2" type="password" formControlName="confirm" autocomplete="new-password" />
            <app-field-error [control]="form.controls.confirm" [messages]="{ mismatch: 'Las contraseñas no coinciden.' }" />
          </div>
          @if (error()) {
            <div class="form-error" role="alert">
              <p>{{ error() }}</p>
              <a routerLink="/recuperar">Pedir un enlace nuevo</a>
            </div>
          }
          <button class="btn btn-primary" type="submit" [disabled]="loading()">
            {{ loading() ? 'Guardando…' : 'Guardar contraseña' }}
          </button>
        </form>
      }
    </section>
  `,
})
export class ResetPassword {
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  protected readonly form = inject(FormBuilder).nonNullable.group({
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(128)]],
    confirm: ['', [Validators.required, sameAsPassword]],
  });
  protected readonly loading = signal(false);
  protected readonly done = signal(false);
  protected readonly error = signal<string | null>(null);

  async submit() {
    this.form.controls.confirm.updateValueAndValidity();
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const token = this.route.snapshot.queryParamMap.get('token') ?? '';
    this.loading.set(true);
    this.error.set(null);
    try {
      await this.auth.resetPassword(token, this.form.controls.password.value);
      this.done.set(true);
    } catch (e) {
      this.error.set(readApiError(e).message);
    } finally {
      this.loading.set(false);
    }
  }
}
