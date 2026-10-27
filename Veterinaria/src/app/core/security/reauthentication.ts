import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { defer, finalize, Observable, Subject, take, throwError } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Auth } from '../services/auth/auth';
import { BACKEND_PENDING, ReauthAction } from './contracts';
import { apiFailure, describeApiFailure } from './api-error';
@Injectable({providedIn: 'root'})
export class Reauthentication {
  private readonly auth = inject(Auth);
  readonly scope = signal<{action: ReauthAction; resource: string | null} | null>(null);
  readonly busy = signal(false);
  readonly mfaRequired = signal(false);
  readonly error = signal('');
  private pending: {result: Subject<unknown>; operation: (proof: string) => Observable<unknown>; generation: number} | null = null;
  constructor() {this.auth.currentUser$.pipe(takeUntilDestroyed(inject(DestroyRef))).subscribe(user => {if (!user && this.pending) this.cancel('La sesión terminó.');});}
  run<T>(action: ReauthAction, resource: string | null, operation: (proof: string) => Observable<T>): Observable<T> {
    return defer(() => {
      if (!this.auth.security.canReauthenticate(action)) return throwError(() => new Error(BACKEND_PENDING));
      if (this.pending) return throwError(() => new Error('Finaliza la confirmación de identidad en curso.'));
      const result = new Subject<unknown>();
      this.pending = {result, operation, generation: this.auth.getSessionGeneration()};
      this.mfaRequired.set(this.auth.getCurrentUser()?.twofa_habilitado === true);
      this.error.set(''); this.scope.set({action, resource});
      return result.asObservable() as Observable<T>;
    });
  }
  confirm(password: string, code: string): void {
    const scope = this.scope(); const pending = this.pending;
    if (!scope || !pending || this.busy()) return;
    if (!password || (this.mfaRequired() && !/^\d{6}$/.test(code))) {this.error.set('Ingresa tu contraseña y el código de seis dígitos si tienes MFA.'); return;}
    this.busy.set(true); this.error.set('');
    this.auth.security.reauthenticate(scope.action, scope.resource, password, this.mfaRequired() ? code : undefined).pipe(take(1), finalize(() => this.busy.set(false))).subscribe({
      next: proof => {
        if (this.pending !== pending) return;
        if (pending.generation !== this.auth.getSessionGeneration() || proof.action !== scope.action || proof.resource_id !== scope.resource || !proof.reauth_token || !Number.isFinite(proof.expires_in) || proof.expires_in <= 0) {
          this.cancel('La confirmación ya no corresponde a esta sesión u operación.'); return;
        }
        // Proof is used exactly once, immediately. Never store it or replay a failed mutation.
        this.pending = null; this.scope.set(null);
        pending.operation(proof.reauth_token).pipe(take(1)).subscribe({next: value => pending.result.next(value), error: e => pending.result.error(e), complete: () => pending.result.complete()});
      }, error: e => {if (this.pending === pending) this.error.set(describeApiFailure(apiFailure(e)));}
    });
  }
  cancel(message = 'Confirmación cancelada.'): void {
    const pending = this.pending; this.pending = null; this.scope.set(null); this.error.set('');
    pending?.result.error(new Error(message));
  }
}
