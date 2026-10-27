import { HttpErrorResponse } from '@angular/common/http';
export interface ApiFailure {code: string; message: string; retryAfter: number; requestId: string | null;}
/** Never expose backend exceptions, credentials or arbitrary HTML to the interface. */
export function apiFailure(error: unknown): ApiFailure {
  if (!(error instanceof HttpErrorResponse)) return {code: 'CLIENT_ERROR', message: error instanceof Error ? error.message : 'No se pudo completar la operación.', retryAfter: 0, requestId: null};
  const code = typeof error.error?.error?.code === 'string' ? error.error.error.code : `HTTP_${error.status}`;
  const messages: Record<string, string> = {
    INVALID_CREDENTIALS: 'Credenciales incorrectas.', REAUTH_REQUIRED: 'Confirma tu identidad antes de continuar.',
    INVALID_REAUTH_PROOF: 'La confirmación de identidad ya no es válida. Vuelve a confirmar.',
    SESSION_REVOKED: 'La sesión fue revocada. Inicia sesión nuevamente.', SESSION_EXPIRED: 'La sesión expiró.',
    TOKEN_EXPIRED: 'La sesión expiró.', ACCOUNT_RESTRICTED: 'El acceso a esta cuenta está restringido.',
    ACTIVE_APPOINTMENT_EXISTS: 'La mascota ya tiene una cita pendiente.', STATE_CONFLICT: 'Los datos cambiaron. Actualiza la información.',
    INVALID_CHALLENGE: 'La verificación expiró o no es válida.', FORBIDDEN: 'No tienes permiso para esta operación.'
  };
  const defaults: Record<number, string> = {0: 'No se pudo conectar con el servidor.', 400: 'Revisa los datos o el código de verificación.', 401: 'No se pudo verificar el acceso.', 403: 'No tienes permiso para esta operación.', 404: 'El recurso no está disponible.', 409: 'Los datos cambiaron. Actualiza la información.', 422: 'Revisa los campos del formulario.', 429: 'Demasiados intentos. Espera antes de volver a intentar.', 503: 'El servicio de seguridad no está disponible.'};
  const raw = error.headers.get('Retry-After');
  const seconds = raw && /^\d+$/.test(raw) ? Number(raw) : error.error?.error?.retry_after_seconds;
  const requestId = error.headers.get('X-Request-ID') ?? error.error?.request_id;
  const serverMessage = error.error?.error?.message;
  const message = error.status >= 400 && error.status < 500 && typeof serverMessage === 'string'
    ? serverMessage.replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, 320) : '';
  return {code, message: message || (messages[code] ?? defaults[error.status] ?? 'No se pudo completar la operación.'),
    retryAfter: typeof seconds === 'number' && Number.isFinite(seconds) ? Math.max(0, Math.min(seconds, 86400)) : 0,
    requestId: typeof requestId === 'string' && /^[a-zA-Z0-9-]{1,80}$/.test(requestId) ? requestId : null};
}

export function describeApiFailure(failure: ApiFailure): string {
  return failure.message + (failure.requestId ? ` Referencia: ${failure.requestId}` : '') +
    (failure.retryAfter ? ` Intenta de nuevo en ${failure.retryAfter} s.` : '');
}
