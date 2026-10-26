import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Auth } from '../../core/services/auth/auth';
import { Totp } from '../../core/services/auth/totp';
import { ToastService } from '../../core/services/extra/toast-service';
import { TwoFactorConfigResponse, UserData } from '../../core/models/auth';

@Component({
  selector: 'app-profile',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class Profile {
  private readonly formBuilder = inject(FormBuilder);
  private readonly auth = inject(Auth);
  private readonly totp = inject(Totp);
  private readonly toast = inject(ToastService);

  readonly personalForm = this.formBuilder.group({
    nombre: ['', [Validators.required]],
    apellidos: ['', [Validators.required]],
    correo: ['', [Validators.required, Validators.email]],
    telefono: ['', [Validators.required]]
  });

  readonly passwordForm = this.formBuilder.group({
    nueva: ['', [Validators.required, Validators.minLength(8)]],
    confirmacion: ['', [Validators.required]]
  });

  twofa_habilitado = signal(false);
  twofaModalOpen = signal(false);
  twofaLoading = signal(false);
  twofaConfig = signal<TwoFactorConfigResponse | null>(null);
  twofaCode = '';
  twofaConfirming = signal(false);
  twofaDisableModalOpen = signal(false);
  twofaDisablePassword = '';
  twofaDisabling = signal(false);
  passwordSaving = signal(false);

  constructor() {
    const user = this.auth.getCurrentUser();
    if (user) {
      this.personalForm.patchValue({
        nombre: user.nombre,
        apellidos: user.apellidos ?? '',
        correo: user.correo,
        telefono: user.telefono ?? ''
      });
      this.twofa_habilitado.set(user.twofa_habilitado ?? false);
    }
  }

  ngOnInit(): void {
    this.totp.have2fa().subscribe({
      next: (habilitado) => {
        this.twofa_habilitado.set(habilitado);
      },
      error: () => {
        this.toast.show('No se pudo verificar el estado de 2FA.');
      }
    });
  }

  savePersonalData(): void {
    if (this.personalForm.invalid) {
      this.personalForm.markAllAsTouched();
      return;
    }

    this.toast.show('Datos personales listos para guardar.');
  }

  changePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const { nueva, confirmacion } = this.passwordForm.getRawValue();
    if (nueva !== confirmacion) {
      this.toast.show('Las contraseñas no coinciden.');
      return;
    }

    const user = this.auth.getCurrentUser();
    if (!user) {
      this.toast.show('No se pudo identificar la sesión actual.');
      return;
    }

    this.passwordSaving.set(true);
    this.auth.change_password(nueva!, user.correo).subscribe({
      next: () => {
        this.passwordForm.reset();
        this.toast.show('Contraseña actualizada correctamente.');
        this.passwordSaving.set(false);
      },
      error: () => {
        this.toast.show('No se pudo actualizar la contraseña.');
        this.passwordSaving.set(false);
      }
    });
  }

  openTwoFactorSetup(): void {
    this.twofaModalOpen.set(true);
    this.twofaLoading.set(true);
    this.twofaConfig.set(null);
    this.twofaCode = '';

    this.totp.configurar().subscribe({
      next: config => {
        if (!config?.qr_code) {
          this.twofaLoading.set(false);
          this.twofaModalOpen.set(false);
          this.toast.show('El servidor no devolvió un código QR válido.');
          return;
        }

        this.twofaConfig.set(config);
        this.twofaLoading.set(false);
      },
      error: () => {
        this.twofaLoading.set(false);
        this.twofaModalOpen.set(false);
        this.toast.show('No se pudo iniciar la configuración de 2FA.');
      }
    });
  }

  closeTwoFactorSetup(): void {
    if (!this.twofaConfirming()) {
      this.twofaModalOpen.set(false);
    }
  }

  /*
  copyManualSecret(): void {
    if (!this.twofaConfig) {
      return;
    }

    navigator.clipboard.writeText(this.twofaConfig.secreto_manual).then(
      () => this.toast.show('Clave manual copiada.'),
      () => this.toast.show('No se pudo copiar la clave manual.')
    );
  }
  */


  updateTwoFactorCode(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.twofaCode = input.value.replace(/\D/g, '').slice(0, 6);
    input.value = this.twofaCode;
  }

  confirmTwoFactor(): void {
    if (!/^\d{6}$/.test(this.twofaCode)) {
      this.toast.show('Ingresa un código TOTP válido de 6 dígitos.');
      return;
    }

    this.twofaConfirming.set(true);
    this.totp.confirmar(this.twofaCode).subscribe({
      next: () => {
        this.twofa_habilitado.set(true);
        this.twofaConfirming.set(false);
        this.twofaModalOpen.set(false);
        this.toast.show('Autenticación de dos factores activada.');
      },
      error: error => {
        this.twofaConfirming.set(false);
        const detail = error?.error?.detail;
        this.toast.show(detail || 'Código inválido o tiempo expirado.');
      }
    });
  }

  disableTwoFactor(): void {
    this.twofaDisablePassword = '';
    this.twofaDisableModalOpen.set(true);
  }

  closeDisableTwoFactor(): void {
    if (!this.twofaDisabling()) {
      this.twofaDisableModalOpen.set(false);
      this.twofaDisablePassword = '';
    }
  }

  confirmDisableTwoFactor(): void {
    if (!this.twofaDisablePassword.trim()) {
      this.toast.show('Ingresa tu contraseña para continuar.');
      return;
    }

    this.twofaDisabling.set(true);
    this.totp.desactivar(this.twofaDisablePassword).subscribe({
      next: () => {
        this.twofa_habilitado.set(false);
        this.twofaDisableModalOpen.set(false);
        this.twofaDisablePassword = '';
        this.twofaDisabling.set(false);
        this.toast.show('Autenticación de dos factores desactivada.');
      },
      error: error => {
        this.twofaDisabling.set(false);
        const detail = error?.error?.detail;
        this.toast.show(detail || 'No se pudo desactivar la autenticación de dos factores.');
      }
    });
  }

  get currentUser(): UserData | null {
    return this.auth.getCurrentUser();
  }

  get qrCodeSource(): string {
    const qrCode = this.twofaConfig()?.qr_code ?? '';
    return qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`;
  }
}
