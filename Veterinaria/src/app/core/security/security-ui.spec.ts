import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Auth } from '../services/auth/auth';
import { Reauthentication } from './reauthentication';
import { SecurityCenter } from '../../pages/security/security-center/security-center';
import { Confirm } from '../../pages/auth/confirm/confirm';
import { ReauthDialog } from '../../shared/components/reauth-dialog/reauth-dialog';
import { signal } from '@angular/core';
import { Totp } from '../services/auth/totp';
import { Profile } from '../../pages/profile/profile';
import { ToastService } from '../services/extra/toast-service';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { authInterceptor } from '../interceptors/auth/auth-interceptor';
import { auditGuard } from '../guards/auth/session-guard';
import { firstValueFrom } from 'rxjs';

describe('Security interfaces', () => {
  it('preserves the recovery screen and explains why a legacy code cannot reset the password', async () => {
    TestBed.configureTestingModule({imports:[Confirm],providers:[provideZonelessChangeDetection(),provideRouter([]),{provide:Auth,useValue:{
      recoveryEmail:()=> 'ana@example.test', check_code:()=>of({msg:'bien'}),canResetPassword:()=>false
    }}]});
    const fixture=TestBed.createComponent(Confirm); await fixture.whenStable(); fixture.componentInstance.codeForm.setValue({code:'012345'}); fixture.componentInstance.check_code(); await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('[role=alert]').textContent).toContain('ticket seguro');
  });
  it('keeps reauthentication credentials out of the UI model after confirmation', async () => {
    const scope=signal({action:'password:change',resource:null}); const confirm=jasmine.createSpy('confirm');
    TestBed.configureTestingModule({imports:[ReauthDialog],providers:[provideZonelessChangeDetection(),{provide:Reauthentication,useValue:{scope,mfaRequired:signal(false),busy:signal(false),error:signal(''),confirm,cancel:()=>scope.set(null as never)}}]});
    const fixture=TestBed.createComponent(ReauthDialog); await fixture.whenStable(); fixture.componentInstance.password='never-persist'; fixture.componentInstance.code='012345'; fixture.componentInstance.confirm();
    expect(confirm).toHaveBeenCalledWith('never-persist','012345'); expect(fixture.componentInstance.password).toBe(''); expect(fixture.componentInstance.code).toBe('');
    expect(fixture.nativeElement.querySelector('[role=dialog]').getAttribute('aria-modal')).toBe('true');
  });
});


describe('Confirmed session management integration', () => {
  let auth: Auth; let http: HttpTestingController; let router: Router; let flow: Reauthentication;
  const base='http://localhost:8000/';
  const rows=[
    {session_id:'current',created_at:'2026-10-26T08:00:00Z',last_seen_at:'2026-10-26T08:10:00Z',expires_at:'2026-11-02T08:00:00Z',is_current:true,device_label:'Navegador',ip_masked:null},
    {session_id:'other',created_at:'2026-10-25T08:00:00Z',last_seen_at:'2026-10-25T08:10:00Z',expires_at:'2026-11-01T08:00:00Z',is_current:false,device_label:'Navegador',ip_masked:null}
  ];
  beforeEach(() => {
    TestBed.configureTestingModule({imports:[SecurityCenter,ReauthDialog,Profile],providers:[provideZonelessChangeDetection(),provideRouter([]),
      provideHttpClient(withInterceptors([authInterceptor])),provideHttpClientTesting()]});
    auth=TestBed.inject(Auth); http=TestBed.inject(HttpTestingController); router=TestBed.inject(Router); flow=TestBed.inject(Reauthentication);
    spyOn(router,'navigate').and.resolveTo(true); spyOn(window,'confirm').and.returnValue(true);
  });
  afterEach(() => {auth.ngOnDestroy(); http.verify();});
  function login(mfa=true, permissions: string[]=[]): void {
    auth.login({usuario_mail:'test',contra:'test-password'}).subscribe();
    http.expectOne(base+'auth/csrf').flush({csrf_token:'initial'});
    const stamp=Math.floor(Date.now()/1000); const payload={sub:'7',sid:'current',jti:'test-jti',token_use:'access',iat:stamp,nbf:stamp,exp:stamp+900,iss:'test',aud:'test'};
    http.expectOne(base+'auth/login').flush({status:'authenticated',access_token:`e30.${btoa(JSON.stringify(payload))}.signature`,token_type:'bearer',expires_in:900,session_id:'current',csrf_token:'rotated',
      user:{id_usuario:7,usuario:'test',nombre:'Test',apellidos:'User',correo_electronico:'test@example.test',rol:'C',twofa_habilitado:mfa,permissions}});
  }
  async function screen() {
    const fixture=TestBed.createComponent(SecurityCenter); await fixture.whenStable();
    const request=http.expectOne(base+'auth/sessions');
    expect(request.request.headers.get('Authorization')).toBe('Bearer '+auth.getToken()); request.flush({items:rows});
    await fixture.whenStable(); return fixture;
  }
  function proof(): void {
    const request=http.expectOne(base+'auth/reauthenticate');
    expect(request.request.headers.get('Authorization')).toBe('Bearer '+auth.getToken());
    request.flush({reauth_token:'one-use-proof',expires_in:300,action:'sessions:revoke_all',resource_id:null});
  }
  it('lists sessions by default and replaces the obsolete pending notice', async () => {
    login(); const fixture=await screen();
    expect(fixture.nativeElement.querySelectorAll('article.session').length).toBe(2);
    expect(fixture.nativeElement.textContent).toContain('Sesión actual');
    expect(fixture.nativeElement.textContent).not.toContain('Gestión remota pendiente');
    expect(fixture.nativeElement.textContent).not.toContain('Recargar la página requiere');
    expect(fixture.nativeElement.textContent).toContain('no registrada');
  });
  it('removes another session only after confirmed DELETE 204', async () => {
    login(); const fixture=await screen(); const component=fixture.componentInstance;
    component.revoke(component.sessions()[1]); expect(component.sessions().length).toBe(2);
    const request=http.expectOne(base+'auth/sessions/other'); expect(request.request.method).toBe('DELETE');
    expect(request.request.headers.get('Authorization')).toBe('Bearer '+auth.getToken());
    expect(request.request.withCredentials).toBeTrue(); request.flush(null,{status:204,statusText:'No Content'});
    expect(component.sessions().length).toBe(1); expect(auth.isAuthenticated()).toBeTrue();
    expect(component.message()).toContain('revocada');
  });
  it('keeps the session list on rejection and does not announce a revocation', async () => {
    login(); const fixture=await screen(); const component=fixture.componentInstance;
    component.revoke(component.sessions()[1]); http.expectOne(base+'auth/sessions/other').flush({error:{code:'NOT_FOUND',message:'Sesión no disponible'},request_id:'denied-session'},{status:404,statusText:'Not Found'});
    expect(component.sessions().length).toBe(2); expect(component.message()).toBe(''); expect(component.error()).toContain('denied-session');
  });
  it('uses cookie logout for the current session and announces confirmation only after 204', async () => {
    login(); const fixture=await screen(); fixture.componentInstance.revoke(fixture.componentInstance.sessions()[0]);
    http.expectNone(base+'auth/sessions/current'); const request=http.expectOne(base+'auth/logout');
    expect(request.request.withCredentials).toBeTrue(); expect(request.request.headers.get('X-CSRF-Token')).toBe('rotated');
    expect(auth.notice()).not.toContain('confirmado'); expect(auth.getToken()).toBeNull();
    request.flush(null,{status:204,statusText:'No Content'}); expect(auth.notice()).toContain('confirmado');
  });
  it('distinguishes a local-only logout when Backend cannot confirm revocation', () => {
    login(); auth.logout(); const request=http.expectOne(base+'auth/logout');
    request.flush({error:{code:'SECURITY_DEPENDENCY_UNAVAILABLE'}},{status:503,statusText:'Unavailable'});
    expect(auth.getToken()).toBeNull(); expect(auth.notice()).toContain('solo en este navegador');
    expect(auth.notice()).toContain('No se confirmó');
  });
  it('reauthenticates with fresh TOTP before revoking other sessions and consumes the proof once', async () => {
    login(true); const fixture=await screen(); const component=fixture.componentInstance;
    component.includeCurrent=false; component.revokeAll();
    http.expectNone(base+'auth/sessions/revoke-all'); expect(flow.scope()?.action).toBe('sessions:revoke_all');
    flow.confirm('current-password','012345');
    const request=http.expectOne(base+'auth/reauthenticate'); expect(request.request.body).toEqual({action:'sessions:revoke_all',resource_id:null,contrasena:'current-password',code:'012345'});
    request.flush({reauth_token:'one-use-proof',expires_in:300,action:'sessions:revoke_all',resource_id:null});
    const revoke=http.expectOne(base+'auth/sessions/revoke-all'); expect(revoke.request.body).toEqual({include_current:false});
    expect(revoke.request.headers.get('X-Reauth-Token')).toBe('one-use-proof'); expect(revoke.request.withCredentials).toBeTrue();
    expect(revoke.request.headers.get('Authorization')).toBe('Bearer '+auth.getToken()); revoke.flush(null,{status:204,statusText:'No Content'});
    expect(auth.isAuthenticated()).toBeTrue(); expect(component.sessions().map(s=>s.session_id)).toEqual(['current']);
    flow.confirm('current-password','123456'); http.expectNone(base+'auth/sessions/revoke-all');
  });
  it('omits TOTP when disabled and clears local identity only after include_current true succeeds', async () => {
    login(false); const fixture=await screen(); const component=fixture.componentInstance;
    component.includeCurrent=true; component.revokeAll(); flow.confirm('current-password','999999');
    const request=http.expectOne(base+'auth/reauthenticate'); expect(request.request.body).toEqual({action:'sessions:revoke_all',resource_id:null,contrasena:'current-password'});
    request.flush({reauth_token:'one-use-proof',expires_in:300,action:'sessions:revoke_all',resource_id:null});
    const revoke=http.expectOne(base+'auth/sessions/revoke-all'); expect(revoke.request.body).toEqual({include_current:true});
    expect(auth.isAuthenticated()).toBeTrue(); revoke.flush(null,{status:204,statusText:'No Content'});
    expect(auth.getToken()).toBeNull(); expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
  });
  it('cancels reauthentication without revoking anything', async () => {
    login(); const fixture=await screen(); fixture.componentInstance.revokeAll(); flow.cancel();
    http.expectNone(base+'auth/reauthenticate'); http.expectNone(base+'auth/sessions/revoke-all'); expect(fixture.componentInstance.busy()).toBeFalse();
  });
  it('does not close the active session after wrong reauthentication credentials', async () => {
    login(); const fixture=await screen(); fixture.componentInstance.revokeAll(); flow.confirm('wrong','012345');
    http.expectOne(base+'auth/reauthenticate').flush({error:{code:'INVALID_CREDENTIALS',message:'Credenciales incorrectas'}},{status:401,statusText:'Unauthorized'});
    expect(auth.isAuthenticated()).toBeTrue(); http.expectNone(base+'auth/sessions/revoke-all'); flow.cancel();
  });
  it('hides the TOTP field when MFA is disabled', async () => {
    login(false); flow.run('sessions:revoke_all',null,proof=>auth.security.revokeAll(false,proof)).subscribe({error:()=>{}});
    const fixture=TestBed.createComponent(ReauthDialog); await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('input[name="code"]')).toBeNull(); flow.cancel();
  });
  it('keeps reauthentication valid across access refresh within the same session', async () => {
    login(false); const fixture=await screen(); fixture.componentInstance.revokeAll();
    auth.refresh().subscribe(); const stamp=Math.floor(Date.now()/1000);
    const claims={sub:'7',sid:'current',jti:'refreshed-jti',token_use:'access',iat:stamp,nbf:stamp,exp:stamp+900,iss:'test',aud:'test'};
    http.expectOne(base+'auth/refresh').flush({status:'authenticated',access_token:`e30.${btoa(JSON.stringify(claims))}.signature`,token_type:'bearer',expires_in:900,session_id:'current',csrf_token:'after-refresh',
      user:{id_usuario:7,usuario:'test',nombre:'Test',apellidos:'User',correo_electronico:'test@example.test',rol:'C',twofa_habilitado:false,permissions:[]}});
    flow.confirm('current-password',''); proof();
    http.expectOne(base+'auth/sessions/revoke-all').flush(null,{status:204,statusText:'No Content'});
    expect(auth.isAuthenticated()).toBeTrue();
  });
  it('ignores obsolete revoke-all completion after a different authentication starts', async () => {
    login(false); const fixture=await screen(); fixture.componentInstance.includeCurrent=true;
    fixture.componentInstance.revokeAll(); flow.confirm('current-password',''); proof();
    const old=http.expectOne(base+'auth/sessions/revoke-all'); auth.invalidate(); login(false);
    old.flush(null,{status:204,statusText:'No Content'}); expect(auth.isAuthenticated()).toBeTrue();
  });
  it('uses the current MFA status response and synchronizes authenticated identity', () => {
    login(false); TestBed.inject(Totp).have2fa().subscribe({next: enabled=>expect(enabled).toBeTrue(),error:()=>fail('current MFA response rejected')});
    http.expectOne(base+'totp/have2fa').flush({twofa_habilitado:true});
    expect(auth.getCurrentUser()?.twofa_habilitado).toBeTrue();
  });
  it('reauthenticates before configuring MFA and only then shows the QR in the profile', async () => {
    login(false); const fixture=TestBed.createComponent(Profile); await fixture.whenStable();
    http.expectOne(base+'totp/have2fa').flush({twofa_habilitado:false});
    fixture.componentInstance.openTwoFactorSetup(); expect(fixture.componentInstance.twofaModalOpen()).toBeFalse();
    http.expectNone(base+'totp/configurar'); expect(flow.scope()?.action).toBe('mfa:configure');
    flow.confirm('current-password',''); const reauth=http.expectOne(base+'auth/reauthenticate');
    expect(reauth.request.body).toEqual({action:'mfa:configure',resource_id:null,contrasena:'current-password'});
    reauth.flush({reauth_token:'mfa-proof',expires_in:300,action:'mfa:configure',resource_id:null});
    const configure=http.expectOne(base+'totp/configurar'); expect(configure.request.body).toBeNull();
    expect(configure.request.headers.get('X-Reauth-Token')).toBe('mfa-proof');
    expect(configure.request.headers.get('Authorization')).toBe('Bearer '+auth.getToken());
    configure.flush({success:true,qr_code:'data:image/png;base64,AA==',expires_at:'2026-10-26T23:00:00Z'});
    expect(fixture.componentInstance.twofaModalOpen()).toBeTrue();
    expect(fixture.componentInstance.qrCodeSource).toBe('data:image/png;base64,AA==');
  });
  it('accepts MFA confirmation cookie rotation and bootstraps fresh CSRF before refresh', () => {
    login(false); TestBed.inject(Totp).confirmar('012345').subscribe();
    const confirm=http.expectOne(base+'totp/confirmar'); expect(confirm.request.withCredentials).toBeTrue();
    expect(confirm.request.body).toEqual({code:'012345'}); confirm.flush({success:true,twofa_habilitado:true});
    expect(auth.getCurrentUser()?.twofa_habilitado).toBeTrue();
    auth.refresh().subscribe(); const csrf=http.expectOne(base+'auth/csrf'); expect(csrf.request.withCredentials).toBeTrue();
    csrf.flush({csrf_token:'mfa-rotated-csrf'}); const refresh=http.expectOne(base+'auth/refresh');
    expect(refresh.request.headers.get('X-CSRF-Token')).toBe('mfa-rotated-csrf');
    refresh.flush({error:{code:'SESSION_EXPIRED'}},{status:401,statusText:'Unauthorized'});
  });
  it('cancels MFA setup without sending an unproven configure request', () => {
    login(false); TestBed.inject(Totp).configurar().subscribe({error:()=>{}}); flow.cancel();
    http.expectNone(base+'auth/reauthenticate'); http.expectNone(base+'totp/configurar');
  });
  it('does not grant audit access from the role alone', async () => {
    login(false); const fixture=await screen(); expect(fixture.nativeElement.querySelector('a[href="/security/audit"]')).toBeNull();
    const result=await firstValueFrom(TestBed.runInInjectionContext(()=>auditGuard({} as never,{} as never)) as import('rxjs').Observable<unknown>);
    expect(result).not.toBeTrue(); http.expectNone(request=>request.url.endsWith('security/audit-events'));
  });
  it('connects audit filters only with explicit server permission', async () => {
    login(false,['security:audit:read']); TestBed.inject(ActivatedRoute).snapshot.data['audit']=true;
    const fixture=TestBed.createComponent(SecurityCenter); await fixture.whenStable();
    const component=fixture.componentInstance; component.from='2026-10-01T00:00'; component.to='2026-10-02T00:00'; component.loadAudit();
    const request=http.expectOne(request=>request.url===base+'security/audit-events');
    expect(request.request.params.get('from')).toBe('2026-10-01T00:00:00.000Z');
    expect(request.request.headers.get('Authorization')).toBe('Bearer '+auth.getToken()); request.flush({items:[],next_cursor:null});
    await fixture.whenStable(); expect(fixture.nativeElement.textContent).toContain('No se encontraron eventos');
  });
});
