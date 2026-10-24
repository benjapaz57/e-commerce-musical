import { Component, afterNextRender, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { readApiError } from '../../core/api/api-error';

@Component({
  selector: 'app-verify-email',
  imports: [RouterLink],
  template: `
    <section class="auth-card">
      @switch (state()) {
        @case ('loading') { <h1>Confirmando tu email…</h1> }
        @case ('ok') {
          <h1>Email confirmado</h1>
          <p>Tu cuenta está activa.</p>
          <a class="btn btn-primary" routerLink="/ingresar">Ingresar</a>
        }
        @case ('error') {
          <h1>No pudimos confirmar tu email</h1>
          <p>{{ error() }}</p>
          <p class="muted">Ingresá con tu email y contraseña para pedir un enlace nuevo.</p>
          <a class="btn btn-secondary" routerLink="/ingresar">Ir a ingresar</a>
        }
      }
    </section>
  `,
})
export class VerifyEmail {
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  protected readonly state = signal<'loading' | 'ok' | 'error'>('loading');
  protected readonly error = signal('');

  constructor() {
    afterNextRender(async () => {
      const token = this.route.snapshot.queryParamMap.get('token');
      if (!token) {
        this.error.set('El enlace está incompleto.');
        this.state.set('error');
        return;
      }
      try {
        await this.auth.verifyEmail(token);
        this.state.set('ok');
      } catch (e) {
        this.error.set(readApiError(e).message);
        this.state.set('error');
      }
    });
  }
}
