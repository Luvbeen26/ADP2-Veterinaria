import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { Auth } from '../../../core/services/auth/auth';
import { apiFailure } from '../../../core/security/api-error';
@Component({selector: 'app-update-password', imports: [ReactiveFormsModule], templateUrl: './update-password.html', styleUrl: './update-password.css'})
export class UpdatePassword {
  private readonly auth = inject(Auth); private readonly router = inject(Router);
  readonly passwordForm = inject(FormBuilder).group({contra: ['', [Validators.required, Validators.minLength(15), Validators.maxLength(128)]], confirm: ['', Validators.required]});
  readonly error = signal(''); readonly busy = signal(false);
  ngOnInit(): void {if (!this.auth.canResetPassword()) void this.router.navigate(['/auth/restore']);}
  change_password(): void {
    if (this.busy() || this.passwordForm.invalid) {this.passwordForm.markAllAsTouched(); return;}
    this.busy.set(true); this.error.set('');
    const {contra, confirm} = this.passwordForm.getRawValue();
    this.auth.resetPassword(contra!, confirm!).pipe(finalize(() => this.busy.set(false))).subscribe({next: () => this.passwordForm.reset(), error: e => this.error.set(apiFailure(e).message)});
  }
}
