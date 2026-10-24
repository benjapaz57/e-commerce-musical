import { Component, computed, effect, input, signal } from '@angular/core';
import { AbstractControl } from '@angular/forms';

// Muestra el primer error de un campo, solo después de que el usuario lo tocó.
@Component({
  selector: 'app-field-error',
  template: `@if (message(); as m) { <p class="field-error" role="alert">{{ m }}</p> }`,
})
export class FieldError {
  readonly control = input.required<AbstractControl | null>();
  readonly messages = input<Record<string, string>>({});

  // Se incrementa con cada cambio del control (valor, estado, touched) para recalcular el mensaje.
  private readonly changes = signal(0);

  constructor() {
    effect((onCleanup) => {
      const sub = this.control()?.events.subscribe(() => this.changes.update((n) => n + 1));
      onCleanup(() => sub?.unsubscribe());
    });
  }

  protected readonly message = computed(() => {
    this.changes();
    const c = this.control();
    if (!c || !c.errors || !(c.touched || c.dirty)) return null;
    const key = Object.keys(c.errors)[0];
    const defaults: Record<string, string> = {
      required: 'Este campo es obligatorio.',
      email: 'Ingresá un email válido.',
      minlength: `Debe tener al menos ${c.errors['minlength']?.requiredLength} caracteres.`,
      maxlength: `Puede tener hasta ${c.errors['maxlength']?.requiredLength} caracteres.`,
    };
    return this.messages()[key] ?? defaults[key] ?? 'Revisá este campo.';
  });
}
