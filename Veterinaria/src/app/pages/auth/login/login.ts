import { Component, DestroyRef, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Auth } from '../../../core/services/auth/auth';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { apiFailure, describeApiFailure } from '../../../core/security/api-error';

@Component({
  selector: 'app-login',
  imports: [RouterLink, ReactiveFormsModule, CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  loginForm!: FormGroup;
  codeForm!: FormGroup;
  readonly requiresTwoFactor = signal(false);
  readonly submitting = signal(false);
  readonly errorMessage = signal('');
  private readonly destroyRef = inject(DestroyRef);
  private challengeId: string | null = null;

  constructor(private auth: Auth, private fb: FormBuilder) {}

  ngOnInit() {
    this.loginForm = this.fb.group({
      usuario_mail: ['', Validators.required],
      contra: ['', Validators.required]
    });
    this.codeForm = this.fb.group({
      code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
    });
  }

  Login() {
    if (this.submitting()) return;
    this.errorMessage.set('');
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.auth.login(this.loginForm.value).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.submitting.set(false))
    ).subscribe({
      next: response => {
        if ('requires_2fa' in response && response.requires_2fa) {
          this.challengeId = response.mfa_token;
          this.requiresTwoFactor.set(true);
          this.loginForm.get('contra')?.reset('');
        }
      },
      error: err => this.showError(err)
    });
  }

  verifyTwoFactor() {
    if (this.submitting() || !this.challengeId) return;
    this.errorMessage.set('');
    if (this.codeForm.invalid) {
      this.codeForm.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.auth.verifyTwoFactor(this.challengeId, this.codeForm.value.code).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.submitting.set(false))
    ).subscribe({ error: err => this.showError(err) });
  }

  backToLogin() {
    this.auth.cancelMfa();
    this.challengeId = null;
    this.requiresTwoFactor.set(false);
    this.codeForm.reset();
    this.errorMessage.set('');
  }

  private showError(err: unknown) {
    this.errorMessage.set(describeApiFailure(apiFailure(err)));
  }
  ngOnDestroy(): void { if (this.requiresTwoFactor() || this.submitting()) this.auth.cancelMfa(); this.challengeId = null; this.loginForm?.get('contra')?.reset(''); this.codeForm?.reset(); }
}
