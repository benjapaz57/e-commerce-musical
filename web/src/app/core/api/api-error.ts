import { HttpErrorResponse } from '@angular/common/http';

// Convierte un error de la API en un texto para mostrar y, si existe, su código.
export function readApiError(err: unknown): { message: string; code?: string } {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) return { message: 'No hay conexión con el servidor. Probá de nuevo en unos segundos.' };
    if (err.status === 429) return { message: 'Hiciste demasiados intentos. Esperá un minuto y probá de nuevo.' };
    const body = err.error as { message?: string | string[]; code?: string } | null;
    const msg = Array.isArray(body?.message) ? body.message[0] : body?.message;
    if (msg) return { message: msg, code: body?.code };
  }
  return { message: 'Algo salió mal. Probá de nuevo.' };
}
