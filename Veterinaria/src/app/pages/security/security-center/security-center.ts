import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { Auth } from '../../../core/services/auth/auth';
import { Reauthentication } from '../../../core/security/reauthentication';
import { AuditEvent, AuditQuery, RemoteSession } from '../../../core/security/contracts';
import { apiFailure, describeApiFailure } from '../../../core/security/api-error';
@Component({selector: 'app-security-center', imports: [FormsModule, DatePipe, RouterLink], templateUrl: './security-center.html', styleUrl: './security-center.css'})
export class SecurityCenter {
  readonly auth = inject(Auth); private readonly reauth = inject(Reauthentication);
  readonly audit = inject(ActivatedRoute).snapshot.data['audit'] === true;
  readonly busy = signal(false); readonly error = signal(''); readonly message = signal('');
  readonly sessions = signal<RemoteSession[]>([]); readonly events = signal<AuditEvent[]>([]);
  readonly loaded = signal(false); readonly cursor = signal<string | null>(null);
  private lastQuery?: AuditQuery;
  from = new Date(Date.now() - 86400000).toISOString().slice(0,16);
  to = new Date().toISOString().slice(0,16);
  action = ''; outcome = ''; actor = '';
  includeCurrent = false;
  ngOnInit(): void {if (!this.audit && this.auth.security.sessionEnabled) this.loadSessions();}
  loadSessions(): void {
    if (this.busy() || !this.auth.security.sessionEnabled) return;
    this.busy.set(true); this.error.set(''); this.message.set('');
    this.auth.security.sessions().pipe(finalize(() => this.busy.set(false))).subscribe({next: r => {this.sessions.set(r.items); this.loaded.set(true);}, error: e => this.error.set(describeApiFailure(apiFailure(e)))});
  }
  revoke(session: RemoteSession): void {
    if (this.busy()) return;
    if (!window.confirm(session.is_current ? '¿Cerrar esta sesión?' : '¿Revocar la sesión seleccionada?')) return;
    if (session.is_current) {this.auth.logout(); return;}
    this.busy.set(true); this.error.set(''); this.message.set('');
    this.auth.security.revoke(session.session_id).pipe(finalize(() => this.busy.set(false))).subscribe({next: () => {
      this.sessions.update(items => items.filter(s => s.session_id !== session.session_id));
      this.message.set('Sesión revocada por el servidor.');
    }, error: e => this.error.set(describeApiFailure(apiFailure(e)))});
  }
  revokeAll(): void {
    if (this.busy()) return;
    const include = this.includeCurrent;
    const generation = this.auth.getSessionGeneration();
    this.busy.set(true); this.error.set(''); this.message.set('');
    this.reauth.run('sessions:revoke_all', null, proof => this.auth.security.revokeAll(include, proof)).pipe(finalize(() => this.busy.set(false))).subscribe({next: () => {
      if (generation !== this.auth.getSessionGeneration()) return;
      if (include) this.auth.invalidate('Todas las sesiones fueron revocadas por el servidor.');
      else {this.sessions.update(items => items.filter(s => s.is_current)); this.message.set('Las demás sesiones fueron revocadas por el servidor.');}
    }, error: e => this.error.set(describeApiFailure(apiFailure(e)))});
  }
  loadAudit(next = false): void {
    if (this.busy() || !this.auth.security.auditEnabled || !this.auth.hasPermission('security:audit:read')) return;
    const from = new Date(this.from + 'Z'); const to = new Date(this.to + 'Z');
    if (!Number.isFinite(from.getTime()) || !Number.isFinite(to.getTime()) || to < from || +to - +from > 31 * 86400000 || (this.actor && !/^\d+$/.test(this.actor))) {
      this.error.set('Selecciona fechas UTC válidas, hasta 31 días, y un ID numérico si filtras por usuario.'); return;
    }
    const query: AuditQuery = next && this.lastQuery ? {...this.lastQuery, cursor: this.cursor() ?? undefined} :
      {from: from.toISOString(), to: to.toISOString(), action: this.action || undefined, outcome: this.outcome || undefined, actor_id: this.actor || undefined, limit: 20};
    this.busy.set(true); this.error.set(''); this.message.set('');
    this.auth.security.audit(query).pipe(finalize(() => this.busy.set(false))).subscribe({next: r => {
      this.events.set(r.items); this.cursor.set(r.next_cursor); this.lastQuery = {...query, cursor: undefined}; this.loaded.set(true);
    }, error: e => this.error.set(describeApiFailure(apiFailure(e)))});
  }
}
