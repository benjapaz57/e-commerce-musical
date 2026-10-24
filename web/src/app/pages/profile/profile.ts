import { Component, OnInit, inject, signal } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { GeoService } from '../../core/geo.service';
import { readApiError } from '../../core/api/api-error';
import { FieldError } from '../../shared/field-error';

@Component({
  selector: 'app-profile',
  imports: [ReactiveFormsModule, AsyncPipe, FieldError],
  templateUrl: './profile.html',
})
export class Profile implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly provincias$ = inject(GeoService).provincias$;
  private readonly fb = inject(FormBuilder).nonNullable;

  protected readonly form = this.fb.group({
    displayName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(40)]],
    province: [''],
    city: ['', [Validators.minLength(2), Validators.maxLength(80)]],
  });
  protected readonly saving = signal(false);
  protected readonly saved = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly deleteForm = this.fb.group({ password: ['', Validators.required] });
  protected readonly confirmingDelete = signal(false);
  protected readonly deleteError = signal<string | null>(null);

  ngOnInit() {
    const u = this.auth.user();
    if (u) this.form.setValue({ displayName: u.displayName, province: u.province ?? '', city: u.city ?? '' });
  }

  async save() {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.saving.set(true);
    this.saved.set(false);
    this.error.set(null);
    try {
      const v = this.form.getRawValue();
      await this.auth.updateProfile({
        displayName: v.displayName,
        province: v.province || undefined,
        city: v.city || undefined,
      });
      this.saved.set(true);
      this.form.markAsPristine();
    } catch (e) {
      this.error.set(readApiError(e).message);
    } finally {
      this.saving.set(false);
    }
  }

  async logout() {
    await this.auth.logout();
    await this.router.navigateByUrl('/');
  }

  async deleteAccount() {
    this.deleteForm.markAllAsTouched();
    if (this.deleteForm.invalid) return;
    this.deleteError.set(null);
    try {
      await this.auth.deleteAccount(this.deleteForm.controls.password.value);
      await this.router.navigateByUrl('/');
    } catch (e) {
      this.deleteError.set(readApiError(e).message);
    }
  }
}
