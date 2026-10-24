import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { readApiError } from '../../core/api/api-error';
import { FieldError } from '../../shared/field-error';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, FieldError],
  template: `
    <section class="auth-card">
      <h1>Ingresar</h1>
      <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <div class="field">
          <label for="login-email">Email</label>
          <input id="login-email" type="email" formControlName="email" autocomplete="email" />
          <app-field-error [control]="form.controls.email" />
        </div>
        <div class="field">
          <label for="login-pass">Contraseña</label>
          <input id="login-pass" type="password" formControlName="password" autocomplete="current-password" />
          <app-field-error [control]="form.controls.password" />
        </div>

        @if (error()) {
          <div class="form-error" role="alert">
            <p>{{ error() }}</p>
            @if (unverified()) {
              <button class="btn btn-link" type="button" (click)="resend()" [disabled]="resent()">
                {{ resent() ? 'Enlace enviado, revisá tu email' : 'Enviarme un nuevo enlace' }}
              </button>
            }
          </div>
        }
        <button class="btn btn-primary" type="submit" [disabled]="loading()">
          {{ loading() ? 'Ingresando…' : 'Ingresar' }}
        </button>
      </form>
      <p class="muted"><a routerLink="/recuperar">Olvidé mi contraseña</a></p>
      <p class="muted">¿No tenés cuenta? <a routerLink="/registro">Creá una</a></p>
    </section>
  `,
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly form = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly unverified = signal(false);
  protected readonly resent = signal(false);

  async submit() {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set(null);
    this.unverified.set(false);
    try {
      const { email, password } = this.form.getRawValue();
      await this.auth.login(email, password);
      const back = this.route.snapshot.queryParamMap.get('volver');
      // Solo rutas internas, para no redirigir a sitios externos.
      await this.router.navigateByUrl(back?.startsWith('/') && !back.startsWith('//') ? back : '/perfil');
    } catch (e) {
      const err = readApiError(e);
      this.error.set(err.message);
      this.unverified.set(err.code === 'EMAIL_NO_VERIFICADO');
    } finally {
      this.loading.set(false);
    }
  }

  async resend() {
    await this.auth.resendVerification(this.form.controls.email.value).catch(() => undefined);
    this.resent.set(true);
  }
}
