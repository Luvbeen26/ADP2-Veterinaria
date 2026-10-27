import { Component, signal, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from '../../../core/services/auth/auth';
import { apiFailure } from '../../../core/security/api-error';
import { finalize } from 'rxjs';
@Component({selector: 'app-confirm', imports: [ReactiveFormsModule], templateUrl: './confirm.html', styleUrl: './confirm.css'})
export class Confirm {
  private readonly auth = inject(Auth); private readonly router = inject(Router);
  readonly codeForm = inject(FormBuilder).group({code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]});
  readonly error = signal(''); readonly busy = signal(false);
  correo = this.auth.recoveryEmail();
  ngOnInit(): void {if (!this.correo) void this.router.navigate(['/auth/restore']);}
  Send_email(): void {
    if (this.busy()) return; this.busy.set(true); this.error.set('');
    this.auth.send_email(this.correo).pipe(finalize(() => this.busy.set(false))).subscribe({error: e => this.error.set(apiFailure(e).message)});
  }
  check_code(): void {
    if (this.busy() || this.codeForm.invalid) {this.codeForm.markAllAsTouched(); return;}
    this.busy.set(true); this.error.set('');
    this.auth.check_code(this.codeForm.value.code!, this.correo).pipe(finalize(() => this.busy.set(false))).subscribe({
      next: () => {if (this.auth.canResetPassword()) void this.router.navigate(['/auth/update_password']);
        else this.error.set('Código verificado. El cambio de contraseña está pendiente del ticket seguro de Backend.');},
      error: e => this.error.set(apiFailure(e).message)
    });
  }
}
