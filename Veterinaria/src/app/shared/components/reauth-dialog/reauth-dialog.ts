import { CdkTrapFocus } from '@angular/cdk/a11y';
import { Component, effect, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Reauthentication } from '../../../core/security/reauthentication';
@Component({selector: 'app-reauth-dialog', imports: [FormsModule, CdkTrapFocus], templateUrl: './reauth-dialog.html', styleUrl: './reauth-dialog.css'})
export class ReauthDialog {
  readonly flow = inject(Reauthentication);
  password = ''; code = '';
  constructor() {effect(() => {if (!this.flow.scope()) {this.password = ''; this.code = '';}});}
  readonly labels: Record<string, string> = {'sessions:revoke_all': 'cerrar todas las sesiones', 'password:change': 'cambiar la contraseña', 'mfa:configure': 'configurar MFA', 'mfa:disable': 'desactivar MFA', 'pet:delete': 'eliminar la mascota', 'appointment:delete': 'eliminar la cita', 'consultation:delete': 'eliminar la consulta', 'security:restrict_user': 'restringir el acceso'};
  confirm(): void {this.flow.confirm(this.password, this.code); this.password = ''; this.code = '';}
  cancel(): void {this.password = ''; this.code = ''; this.flow.cancel();}
}
