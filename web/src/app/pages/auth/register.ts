import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { readApiError } from '../../core/api/api-error';
import { FieldError } from '../../shared/field-error';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink, FieldError],
  template: `
    <section class="auth-card">
      @if (sentTo(); as email) {
        <h1>Revisá tu email</h1>
        <p>Te enviamos un enlace a <strong>{{ email }}</strong> para confirmar tu cuenta. Vence en 24 horas.</p>
        <p class="muted">¿No llegó? Revisá la carpeta de spam o <a routerLink="/ingresar">intentá ingresar</a> para pedir uno nuevo.</p>
      } @else {
        <h1>Crear cuenta</h1>
        <p class="muted">Gratis para buscar y contactar vendedores.</p>

        <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <div class="field">
            <label for="reg-name">Nombre visible</label>
            <input id="reg-name" formControlName="displayName" autocomplete="nickname" />
            <p class="hint">Es el nombre que verán otros usuarios.</p>
            <app-field-error [control]="form.controls.displayName" />
          </div>
          <div class="field">
            <label for="reg-email">Email</label>
            <input id="reg-email" type="email" formControlName="email" autocomplete="email" />
            <app-field-error [control]="form.controls.email" />
          </div>
          <div class="field">
            <label for="reg-pass">Contraseña</label>
            <input id="reg-pass" type="password" formControlName="password" autocomplete="new-password" />
            <p class="hint">Mínimo 8 caracteres.</p>
            <app-field-error [control]="form.controls.password" />
          </div>

          @if (error()) { <p class="form-error" role="alert">{{ error() }}</p> }
          <button class="btn btn-primary" type="submit" [disabled]="loading()">
            {{ loading() ? 'Creando cuenta…' : 'Crear cuenta' }}
          </button>
        </form>
        <p class="muted">¿Ya tenés cuenta? <a routerLink="/ingresar">Ingresá</a></p>
      }
    </section>
  `,
})
export class Register {
  private readonly auth = inject(AuthService);
  protected readonly form = inject(FormBuilder).nonNullable.group({
    displayName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(40)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(128)]],
  });
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly sentTo = signal<string | null>(null);

  async submit() {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set(null);
    try {
      await this.auth.register(this.form.getRawValue());
      this.sentTo.set(this.form.controls.email.value.trim().toLowerCase());
    } catch (e) {
      this.error.set(readApiError(e).message);
    } finally {
      this.loading.set(false);
    }
  }
}
