import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { readApiError } from '../../core/api/api-error';
import { FieldError } from '../../shared/field-error';

@Component({
  selector: 'app-forgot-password',
  imports: [ReactiveFormsModule, RouterLink, FieldError],
  template: `
    <section class="auth-card">
      <h1>Recuperar contraseña</h1>
      @if (sent()) {
        <p>Si el email está registrado, te enviamos un enlace para elegir una contraseña nueva. Vence en 60 minutos.</p>
        <a class="btn btn-secondary" routerLink="/ingresar">Volver a ingresar</a>
      } @else {
        <p class="muted">Te enviamos un enlace para elegir una contraseña nueva.</p>
        <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <div class="field">
            <label for="forgot-email">Email</label>
            <input id="forgot-email" type="email" formControlName="email" autocomplete="email" />
            <app-field-error [control]="form.controls.email" />
          </div>
          @if (error()) { <p class="form-error" role="alert">{{ error() }}</p> }
          <button class="btn btn-primary" type="submit" [disabled]="loading()">
            {{ loading() ? 'Enviando…' : 'Enviar enlace' }}
          </button>
        </form>
      }
    </section>
  `,
})
export class ForgotPassword {
  private readonly auth = inject(AuthService);
  protected readonly form = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });
  protected readonly loading = signal(false);
  protected readonly sent = signal(false);
  protected readonly error = signal<string | null>(null);

  async submit() {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set(null);
    try {
      await this.auth.forgotPassword(this.form.controls.email.value);
      this.sent.set(true);
    } catch (e) {
      this.error.set(readApiError(e).message);
    } finally {
      this.loading.set(false);
    }
  }
}
