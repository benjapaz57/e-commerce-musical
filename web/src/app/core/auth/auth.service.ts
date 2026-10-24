import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  province: string | null;
  city: string | null;
  role: 'USER' | 'ADMIN';
  emailVerified: boolean;
  createdAt: string;
}

interface Message {
  message: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly api = '/api';

  private readonly _user = signal<User | null>(null);
  private loaded: Promise<void> | null = null;

  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => this._user() !== null);

  // Consulta la sesión una sola vez; la cookie viaja sola.
  load(): Promise<void> {
    this.loaded ??= firstValueFrom(this.http.get<{ user: User | null }>(`${this.api}/auth/session`))
      .then((r) => this._user.set(r.user))
      .catch(() => this._user.set(null));
    return this.loaded;
  }

  async login(email: string, password: string): Promise<User> {
    const user = await firstValueFrom(this.http.post<User>(`${this.api}/auth/login`, { email, password }));
    this._user.set(user);
    return user;
  }

  async logout(): Promise<void> {
    await firstValueFrom(this.http.post<Message>(`${this.api}/auth/logout`, {})).catch(() => undefined);
    this._user.set(null);
  }

  register(data: { email: string; password: string; displayName: string }) {
    return firstValueFrom(this.http.post<Message>(`${this.api}/auth/register`, data));
  }

  resendVerification(email: string) {
    return firstValueFrom(this.http.post<Message>(`${this.api}/auth/resend-verification`, { email }));
  }

  verifyEmail(token: string) {
    return firstValueFrom(this.http.post<Message>(`${this.api}/auth/verify-email`, { token }));
  }

  forgotPassword(email: string) {
    return firstValueFrom(this.http.post<Message>(`${this.api}/auth/forgot-password`, { email }));
  }

  resetPassword(token: string, password: string) {
    return firstValueFrom(this.http.post<Message>(`${this.api}/auth/reset-password`, { token, password }));
  }

  async updateProfile(data: Partial<Pick<User, 'displayName' | 'province' | 'city'>>): Promise<User> {
    const user = await firstValueFrom(this.http.patch<User>(`${this.api}/users/me`, data));
    this._user.set(user);
    return user;
  }

  async deleteAccount(password: string): Promise<void> {
    await firstValueFrom(this.http.delete<Message>(`${this.api}/users/me`, { body: { password } }));
    this._user.set(null);
  }
}
