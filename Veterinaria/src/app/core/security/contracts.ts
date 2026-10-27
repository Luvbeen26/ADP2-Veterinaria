import { InjectionToken } from '@angular/core';

/** Remaining proposed contracts stay disabled until a coordinated Backend deployment. */
export const ZERO_TRUST_ENABLED = new InjectionToken<boolean>('ZERO_TRUST_ENABLED', {providedIn: 'root', factory: () => false});
/** Public identity contracts: registration, login, CSRF and login MFA. */
export const ZERO_TRUST_LOGIN_ENABLED = new InjectionToken<boolean>('ZERO_TRUST_LOGIN_ENABLED', {providedIn: 'root', factory: () => true});
/** Confirmed session lifecycle and management, including scoped revoke-all reauthentication. */
export const ZERO_TRUST_SESSION_ENABLED = new InjectionToken<boolean>('ZERO_TRUST_SESSION_ENABLED', {providedIn: 'root', factory: () => true});
/** Audit reading is confirmed; effective security:audit:read remains mandatory. */
export const ZERO_TRUST_AUDIT_ENABLED = new InjectionToken<boolean>('ZERO_TRUST_AUDIT_ENABLED', {providedIn: 'root', factory: () => true});
/** Profile MFA setup, confirmation and status use the implemented Backend contract. */
export const ZERO_TRUST_MFA_SETUP_ENABLED = new InjectionToken<boolean>('ZERO_TRUST_MFA_SETUP_ENABLED', {providedIn: 'root', factory: () => true});
export interface Identity {
  id_usuario: number; usuario: string; nombre: string; apellidos: string;
  correo_electronico: string; rol: 'C' | 'V'; twofa_habilitado: boolean; permissions: string[];
}
export interface Authenticated {
  status: 'authenticated'; access_token: string; token_type: 'bearer'; expires_in: number;
  session_id: string; csrf_token: string; user: Identity;
}
export interface MfaRequired {status: 'mfa_required'; challenge_id: string; expires_in: number; methods: string[];}
export interface RemoteSession {
  session_id: string; created_at: string; last_seen_at: string; expires_at: string;
  is_current: boolean; device_label: string; ip_masked: string | null;
}
export type ReauthAction = 'mfa:configure' | 'mfa:disable' | 'password:change' | 'sessions:revoke_all' |
  'pet:delete' | 'appointment:delete' | 'consultation:delete' | 'security:restrict_user';
export interface ReauthProof {reauth_token: string; expires_in: number; action: ReauthAction; resource_id: string | null;}
export interface AuditEvent {
  event_id: string; occurred_at: string; actor_id: number | null; action: string;
  resource_type: string; resource_id: string | null; outcome: 'success' | 'denied' | 'failure';
  reason_code: string; request_id: string; ip_masked: string | null;
}
export interface AuditQuery {from: string; to: string; action?: string; outcome?: string; actor_id?: string; limit?: number; cursor?: string;}
export const BACKEND_PENDING = 'Esta operación requiere el contrato seguro pendiente de Backend.';
