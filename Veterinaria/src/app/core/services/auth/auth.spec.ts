import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { Auth } from './auth';
import { authInterceptor, SecurityFeedback } from '../../interceptors/auth/auth-interceptor';
import { ZERO_TRUST_ENABLED, ZERO_TRUST_LOGIN_ENABLED, ZERO_TRUST_SESSION_ENABLED, ZERO_TRUST_AUDIT_ENABLED, ZERO_TRUST_MFA_SETUP_ENABLED } from '../../security/contracts';
import { ZeroTrustApi } from '../../security/zero-trust-api';
import { Reauthentication } from '../../security/reauthentication';
import { auditGuard, permissionGuard, sessionGuard } from '../../guards/auth/session-guard';
import { apiFailure } from '../../security/api-error';
import { firstValueFrom } from 'rxjs';

const base = 'http://localhost:8000/';
const credentials = {usuario_mail: 'ana', contra: 'existing-password'};
const jwt = (extra: object = {}) => `e30.${btoa(JSON.stringify({id_usuario: 7, usuario: 'ana', nombre: 'Ana', correo: 'ana@example.test', rol: 'C', exp: Math.floor(Date.now()/1000)+3600, ...extra}))}.signature`;
const identity = (permissions: string[] = []) => ({id_usuario:7, usuario:'ana', nombre:'Ana', apellidos:'Perez', correo_electronico:'ana@example.test', rol:'C', twofa_habilitado:false, permissions});
const secureJwt = (extra: object = {}) => jwt({sub:'7',sid:'session-1',jti:'jti-1',token_use:'access',iat:Math.floor(Date.now()/1000),nbf:Math.floor(Date.now()/1000),iss:'test-issuer',aud:'test-audience',...extra});
const authenticated = (permissions: string[] = [], access_token = secureJwt()) => ({status:'authenticated', access_token, token_type:'bearer', expires_in:900, session_id:'session-1', csrf_token:'rotated', user:identity(permissions)});

for (const enabled of [false, true]) describe(`Security contracts (${enabled ? 'proposed confirmed in test' : 'current'})`, () => {
  let auth: Auth; let http: HttpTestingController; let client: HttpClient; let router: Router; let api: ZeroTrustApi;
  beforeEach(() => {
    TestBed.configureTestingModule({providers:[provideZonelessChangeDetection(), provideRouter([]),
      provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting(), {provide:ZERO_TRUST_ENABLED,useValue:enabled}, {provide:ZERO_TRUST_LOGIN_ENABLED,useValue:enabled}, {provide:ZERO_TRUST_SESSION_ENABLED,useValue:enabled}, {provide:ZERO_TRUST_AUDIT_ENABLED,useValue:enabled}, {provide:ZERO_TRUST_MFA_SETUP_ENABLED,useValue:enabled}]});
    auth=TestBed.inject(Auth); http=TestBed.inject(HttpTestingController); client=TestBed.inject(HttpClient); api=TestBed.inject(ZeroTrustApi);
    router=TestBed.inject(Router); spyOn(router,'navigate').and.resolveTo(true);
  });
  afterEach(() => {auth.ngOnDestroy(); http.verify();});
  function login(permissions: string[] = [], token = enabled ? secureJwt() : jwt()): void {
    auth.login(credentials).subscribe();
    if(enabled) {const csrf=http.match(base+'auth/csrf'); csrf.forEach(r=>r.flush({csrf_token:'initial'}));}
    http.expectOne(base+'auth/login').flush(enabled ? authenticated(permissions,token) : {access_token:token});
  }
  it('creates only a memory session and normalizes the actual id_usuario claim', () => {
    const cookies=TestBed.inject(CookieService); const set=spyOn(cookies,'set'); login();
    expect(auth.getCurrentUser()?.id).toBe(7); expect(auth.getToken()).toBeTruthy(); expect(set).not.toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/']);
    if (enabled) {api.logout().subscribe(); const req=http.expectOne(base+'auth/logout'); expect(req.request.headers.get('X-CSRF-Token')).toBe('rotated'); req.flush(null,{status:204,statusText:'No Content'});}
  });
  it('does not attach bearer to third-party URLs or public credentials', () => {
    login(); client.get('https://example.test/pixel').subscribe(); const third=http.expectOne('https://example.test/pixel'); expect(third.request.headers.has('Authorization')).toBeFalse(); third.flush({});
    client.post(base+'auth/login',credentials).subscribe(); const req=http.expectOne(base+'auth/login'); expect(req.request.headers.has('Authorization')).toBeFalse(); req.flush({});
  });
  it('does not attach API credentials to relative frontend assets', () => {
    login(); client.get('/assets/logo.svg').subscribe(); const req=http.expectOne('/assets/logo.svg'); expect(req.request.headers.has('Authorization')).toBeFalse(); req.flush('svg');
  });
  it('ignores a stale unauthorized response after a different login', () => {
    login(); client.get(base+'old').subscribe({error:()=>{}}); const old=http.expectOne(base+'old');
    login([], enabled ? secureJwt({jti:'different'}) : jwt({jti:'different'}));
    old.flush({error:{code:'SESSION_REVOKED'}},{status:401,statusText:'Unauthorized'}); expect(auth.isAuthenticated()).toBeTrue();
  });
  it('attaches bearer only to protected API requests', () => {
    login(); client.get(base+'pet/petsByUserLogged').subscribe(); const req=http.expectOne(base+'pet/petsByUserLogged'); expect(req.request.headers.get('Authorization')).toBe('Bearer '+auth.getToken()); req.flush([]);
  });
  it('keeps session on forbidden and never refreshes it', () => {
    login(); client.get(base+'protected').subscribe({error:()=>{}}); http.expectOne(base+'protected').flush({error:{code:'FORBIDDEN'}},{status:403,statusText:'Forbidden'}); expect(auth.isAuthenticated()).toBeTrue(); http.expectNone(base+'auth/refresh');
  });
  it('wrong password during reauthentication or MFA removal does not log out', () => {
    login(); client.post(base+'totp/desactivar',{contrasena:'wrong'}).subscribe({error:()=>{}}); http.expectOne(base+'totp/desactivar').flush({}, {status:401,statusText:'Unauthorized'}); expect(auth.isAuthenticated()).toBeTrue();
  });
  it('revocation clears local credentials without refresh', () => {
    login(); client.get(base+'protected').subscribe({error:()=>{}}); http.expectOne(base+'protected').flush({error:{code:'SESSION_REVOKED'}},{status:401,statusText:'Unauthorized'}); expect(auth.getToken()).toBeNull(); http.expectNone(base+'auth/refresh');
  });
  it('honors Retry-After without retry loops or another HTTP request', () => {
    client.post(base+'auth/login',credentials).subscribe({error:()=>{}}); http.expectOne(base+'auth/login').flush({},{status:429,statusText:'Rate Limited',headers:{'Retry-After':'120'}});
    client.post(base+'auth/login',credentials).subscribe({error:e=>expect(e.status).toBe(429)}); http.expectNone(base+'auth/login');
    expect(TestBed.inject(SecurityFeedback).retryUntil.size).toBe(1);
  });
  it('does not expose raw backend exceptions', () => {
    client.get(base+'protected').subscribe({error:e=>expect(apiFailure(e).message).not.toContain('SQL secret')}); http.expectOne(base+'protected').flush({detail:'SQL secret'},{status:500,statusText:'Error'});
  });
  it('never calls the unsafe email-only password mutation', () => {
    auth.change_password('new-password','victim@example.test').subscribe({error:e=>expect(e.message).toContain('Backend')}); http.expectNone(base+'auth/update_password');
    auth.resetPassword('long-enough-password','long-enough-password').subscribe({error:()=>{}}); http.expectNone(base+'auth/update_password');
  });
  it('rejects expired, non-access, missing-exp and malformed tokens', () => {
    for(const token of [jwt({exp:1}),jwt({exp:null}),jwt({purpose:'mfa'}),jwt({token_use:'reset'}),'broken']) {
      auth.login(credentials).subscribe({next:()=>fail('invalid access accepted'),error:()=>{}});
      if(enabled) http.match(base+'auth/csrf').forEach(r=>r.flush({csrf_token:'initial'}));
      http.expectOne(base+'auth/login').flush(enabled ? authenticated([],token) : {access_token:token});
      expect(auth.getCurrentUser()).toBeNull();
    }
  });
  it('requires a live MFA challenge and preserves leading zeroes', () => {
    auth.login(credentials).subscribe(); if(enabled) http.expectOne(base+'auth/csrf').flush({csrf_token:'csrf'});
    http.expectOne(base+'auth/login').flush(enabled ? {status:'mfa_required',challenge_id:'challenge',expires_in:180,methods:['totp']} : {requires_2fa:true,mfa_token:'challenge'});
    expect(auth.isAuthenticated()).toBeFalse(); auth.verifyTwoFactor('challenge','012345').subscribe();
    const req=http.expectOne(base+'totp/verificar-2fa'); expect(req.request.headers.has('Authorization')).toBeFalse();
    expect(req.request.body).toEqual(enabled ? {challenge_id:'challenge',code:'012345'} : {token:'challenge',code:'012345'}); req.flush(enabled ? authenticated() : {access_token:jwt()}); expect(auth.isAuthenticated()).toBeTrue();
    if (enabled) {api.logout().subscribe(); const rotated=http.expectOne(base+'auth/logout'); expect(rotated.request.headers.get('X-CSRF-Token')).toBe('rotated'); rotated.flush(null,{status:204,statusText:'No Content'});}
  });
  it('rejects MFA after cancellation without making a request', () => {
    auth.cancelMfa(); auth.verifyTwoFactor('challenge','123456').subscribe({error:()=>{}}); http.expectNone(base+'totp/verificar-2fa');
  });
  it('never accepts late login after local session invalidation', () => {
    auth.login(credentials).subscribe({error:()=>{}}); if(enabled) http.expectOne(base+'auth/csrf').flush({csrf_token:'csrf'});
    const req=http.expectOne(base+'auth/login'); auth.invalidate(); req.flush(enabled ? authenticated() : {access_token:jwt()}); expect(auth.isAuthenticated()).toBeFalse();
  });
  it('only grants audit to explicit server permissions, never to role V', () => {
    login([], (enabled ? secureJwt : jwt)({rol:'V',permissions:['security:audit:read']})); expect(auth.hasPermission('security:audit:read')).toBeFalse();
  });
  if (!enabled) {
    it('never probes any proposed endpoint', () => {
      api.sessions().subscribe({error:()=>{}}); api.refresh().subscribe({error:()=>{}}); api.audit({from:'2026-10-01',to:'2026-10-02'}).subscribe({error:()=>{}});
      auth.restore().subscribe(ok=>expect(ok).toBeFalse()); expect(http.match(()=>true).length).toBe(0);
    });
    it('does not accept a 200 SMTP error as successful code delivery', () => {
      auth.send_email('ana@example.test').subscribe({next:()=>fail('SMTP error accepted'),error:()=>{}}); http.expectOne(base+'auth/send_code').flush({mensaje:'SMTP error'}); expect(auth.recoveryEmail()).toBe('');
    });
    it('valid legacy code never becomes password authorization', () => {
      auth.send_email('ana@example.test').subscribe(); http.expectOne(base+'auth/send_code').flush({success:true,message:'sent',correo:'ana@example.test'});
      auth.check_code('123456','ana@example.test').subscribe(); const r=http.expectOne(base+'auth/enter_code'); expect(r.request.body).toEqual({email:'ana@example.test',code:'123456'}); r.flush({msg:'bien'}); expect(auth.canResetPassword()).toBeFalse();
    });
    it('expires the session locally', () => {
      jasmine.clock().install(); jasmine.clock().mockDate(new Date());
      try {login([],jwt({exp:Math.floor(Date.now()/1000)+2})); jasmine.clock().tick(2100); expect(auth.getToken()).toBeNull();} finally {jasmine.clock().uninstall();}
    });
  } else {
    it('blocks a documented business permission when the server does not grant it', async () => {
      login(); const result=TestBed.runInInjectionContext(()=>permissionGuard('statistics:read')({} as never,{} as never));
      expect(await firstValueFrom(result as import('rxjs').Observable<unknown>)).not.toBeTrue();
    });
    it('allows a documented business permission only from server identity', async () => {
      login(['statistics:read']); const result=TestBed.runInInjectionContext(()=>permissionGuard('statistics:read')({} as never,{} as never));
      expect(await firstValueFrom(result as import('rxjs').Observable<unknown>)).toBeTrue();
    });
    it('shares restoration between concurrent guards and grants audit only from server identity', async () => {
      const first=firstValueFrom(TestBed.runInInjectionContext(()=>sessionGuard({} as never,{} as never)) as import('rxjs').Observable<unknown>);
      const second=firstValueFrom(TestBed.runInInjectionContext(()=>auditGuard({} as never,{} as never)) as import('rxjs').Observable<unknown>);
      http.expectOne(base+'auth/csrf').flush({csrf_token:'csrf'}); http.expectOne(base+'auth/refresh').flush(authenticated(['security:audit:read']));
      expect(await first).toBeTrue(); expect(await second).toBeTrue();
    });
    it('does not restore a session after logout while refresh was in flight', () => {
      api.acceptCsrf('csrf'); auth.refresh().subscribe(ok=>expect(ok).toBeFalse()); const pending=http.expectOne(base+'auth/refresh');
      auth.invalidate(); pending.flush(authenticated()); expect(auth.getToken()).toBeNull();
    });
    it('expires recovery tickets in memory', () => {
      jasmine.clock().install(); jasmine.clock().mockDate(new Date());
      try {
        auth.send_email('ana@example.test').subscribe(); http.expectOne(base+'auth/send_code').flush({message:'generic',challenge_id:'c',expires_in:600});
        auth.check_code('123456','ana@example.test').subscribe(); http.expectOne(base+'auth/enter_code').flush({reset_token:'ticket',expires_in:1});
        jasmine.clock().tick(1001); auth.resetPassword('a-secure-password','a-secure-password').subscribe({error:()=>{}}); http.expectNone(base+'auth/update_password');
      } finally {jasmine.clock().uninstall();}
    });
    it('uses CSRF bootstrap before login and never exposes refresh credentials', () => {
      auth.login(credentials).subscribe(); const csrf=http.expectOne(base+'auth/csrf'); expect(csrf.request.withCredentials).toBeTrue(); csrf.flush({csrf_token:'csrf'});
      const req=http.expectOne(base+'auth/login'); expect(req.request.withCredentials).toBeTrue(); expect(req.request.headers.get('X-CSRF-Token')).toBe('csrf'); req.flush(authenticated());
    });
    it('coalesces concurrent expiry into one refresh and retries each request once', () => {
      login(); client.get(base+'a').subscribe(); client.get(base+'b').subscribe();
      http.expectOne(base+'a').flush({error:{code:'TOKEN_EXPIRED'}},{status:401,statusText:'Unauthorized'});
      http.expectOne(base+'b').flush({error:{code:'TOKEN_EXPIRED'}},{status:401,statusText:'Unauthorized'});
      const refresh=http.expectOne(base+'auth/refresh'); expect(refresh.request.headers.has('Authorization')).toBeFalse(); expect(refresh.request.headers.get('X-CSRF-Token')).toBe('rotated');
      refresh.flush(authenticated([],secureJwt({jti:'new'}))); http.expectOne(base+'a').flush({}); http.expectOne(base+'b').flush({});
    });
    it('never replays a critical mutation carrying a reauthentication proof', () => {
      login(); client.delete(base+'pet/delete/7',{headers:{'X-Reauth-Token':'once'}}).subscribe({error:()=>{}}); http.expectOne(base+'pet/delete/7').flush({error:{code:'TOKEN_EXPIRED'}},{status:401,statusText:'Unauthorized'}); http.expectNone(base+'auth/refresh');
    });
    it('requires a reset ticket and serializes the proposed reset body exactly', () => {
      auth.send_email('ana@example.test').subscribe(); http.expectOne(base+'auth/send_code').flush({message:'generic',challenge_id:'c',expires_in:600});
      auth.check_code('012345','ana@example.test').subscribe(); const code=http.expectOne(base+'auth/enter_code'); expect(code.request.body).toEqual({challenge_id:'c',code:'012345'}); code.flush({reset_token:'ticket',expires_in:300});
      auth.resetPassword('a-secure-password','a-secure-password').subscribe(); const reset=http.expectOne(base+'auth/update_password'); expect(reset.request.body).toEqual({reset_token:'ticket',contra:'a-secure-password',confirm:'a-secure-password'}); expect(reset.request.headers.has('Authorization')).toBeFalse(); reset.flush(null,{status:204,statusText:'No Content'}); expect(auth.canResetPassword()).toBeFalse();
    });
    it('binds reauthentication proof to operation and resource and never executes a mismatch', () => {
      login(); const flow=TestBed.inject(Reauthentication); const operation=jasmine.createSpy('operation'); flow.run('pet:delete','7',operation).subscribe({error:()=>{}}); flow.confirm('password','');
      http.expectOne(base+'auth/reauthenticate').flush({reauth_token:'proof',expires_in:300,action:'pet:delete',resource_id:'8'}); expect(operation).not.toHaveBeenCalled(); expect(flow.scope()).toBeNull();
    });
    it('consumes a matching reauthentication proof only once', () => {
      login(); const flow=TestBed.inject(Reauthentication); flow.run('sessions:revoke_all',null,proof=>api.revokeAll(false,proof)).subscribe(); flow.confirm('password','');
      const req=http.expectOne(base+'auth/reauthenticate'); expect(req.request.body).toEqual({action:'sessions:revoke_all',resource_id:null,contrasena:'password'}); req.flush({reauth_token:'proof',expires_in:300,action:'sessions:revoke_all',resource_id:null});
      const revoke=http.expectOne(base+'auth/sessions/revoke-all'); expect(revoke.request.headers.get('X-Reauth-Token')).toBe('proof'); expect(revoke.request.body).toEqual({include_current:false}); revoke.flush(null,{status:204,statusText:'No Content'}); flow.confirm('password',''); http.expectNone(base+'auth/reauthenticate');
    });
    it('rejects audit ranges longer than 31 days without HTTP', () => {
      api.audit({from:'2026-01-01T00:00:00Z',to:'2026-03-01T00:00:00Z'}).subscribe({error:()=>{}}); http.expectNone(r=>r.url.endsWith('security/audit-events'));
    });
    it('serializes opaque audit pagination and UTC filters without modification', () => {
      api.audit({from:'2026-10-01T00:00:00Z',to:'2026-10-02T00:00:00Z',cursor:'opaque+/=',limit:20}).subscribe(); const r=http.expectOne(r=>r.url.endsWith('security/audit-events')); expect(r.request.params.get('cursor')).toBe('opaque+/='); r.flush({items:[],next_cursor:null});
    });
  }
});

// Production defaults: only the confirmed login/CSRF/MFA contract is enabled.
describe('Confirmed Zero Trust login with remaining contracts disabled', () => {
  let auth: Auth; let http: HttpTestingController; let client: HttpClient; let router: Router;
  beforeEach(() => {
    TestBed.configureTestingModule({providers: [provideZonelessChangeDetection(), provideRouter([]),
      provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting()]});
    auth = TestBed.inject(Auth); http = TestBed.inject(HttpTestingController); client = TestBed.inject(HttpClient);
    router = TestBed.inject(Router); spyOn(router, 'navigate').and.resolveTo(true);
  });
  afterEach(() => {auth.ngOnDestroy(); http.verify();});
  function bootstrap(): void {
    const req = http.expectOne(base + 'auth/csrf');
    expect(req.request.method).toBe('GET'); expect(req.request.withCredentials).toBeTrue();
    expect(req.request.headers.has('Authorization')).toBeFalse(); req.flush({csrf_token: 'bootstrap'});
  }
  it('executes GET csrf before POST login on the same configured API origin', () => {
    auth.login(credentials).subscribe(); http.expectNone(base + 'auth/login'); bootstrap();
    const login = http.expectOne(base + 'auth/login');
    expect(login.request.method).toBe('POST'); expect(login.request.body).toEqual(credentials);
    expect(login.request.withCredentials).toBeTrue(); expect(login.request.headers.get('X-CSRF-Token')).toBe('bootstrap');
    expect(login.request.headers.has('Authorization')).toBeFalse(); login.flush(authenticated());
    expect(auth.isAuthenticated()).toBeTrue(); expect(auth.getCurrentUser()?.id).toBe(7);
    expect(auth.hasPermission('security:audit:read')).toBeFalse();
    expect(auth.security.enabled).toBeFalse();
    auth.security.sessions().subscribe(); http.expectOne(base + 'auth/sessions').flush({items:[]});
  });
  it('bootstraps CSRF before registration and accepts the authenticated 201 response', () => {
    const data={usuario:'ana',nombres:'Ana',apellidos:'Perez',correo:'ana@example.test',contra:'a-valid-new-password',confirm:'a-valid-new-password',rol:'V'};
    auth.register(data).subscribe(); http.expectNone(base+'auth/create_user'); bootstrap();
    const request=http.expectOne(base+'auth/create_user'); expect(request.request.withCredentials).toBeTrue();
    expect(request.request.headers.get('X-CSRF-Token')).toBe('bootstrap'); expect(request.request.headers.has('Authorization')).toBeFalse();
    expect(request.request.body).toEqual({usuario:'ana',nombre:'Ana',apellidos:'Perez',correo_electronico:'ana@example.test',contra:'a-valid-new-password',confirm:'a-valid-new-password'});
    request.flush(authenticated(),{status:201,statusText:'Created'}); expect(auth.isAuthenticated()).toBeTrue();
    expect(auth.get_userRol()).toBe('C'); auth.refresh().subscribe(); const refresh=http.expectOne(base+'auth/refresh');
    expect(refresh.request.headers.get('X-CSRF-Token')).toBe('rotated'); refresh.flush(authenticated());
    http.expectNone(base+'auth/login');
  });
  it('does not submit registration when its CSRF bootstrap fails', () => {
    auth.register({usuario:'ana',nombres:'Ana',apellidos:'Perez',correo:'ana@example.test',contra:'a-valid-new-password',confirm:'a-valid-new-password'}).subscribe({error:()=>{}});
    http.expectOne(base+'auth/csrf').flush({error:{code:'FORBIDDEN',message:'Validación CSRF requerida'}},{status:403,statusText:'Forbidden'});
    http.expectNone(base+'auth/create_user'); http.expectNone(base+'auth/login');
  });
  it('rejects invalid registration passwords locally without truncation or API calls', () => {
    for (const password of ['short','é'.repeat(37)]) {
      auth.register({usuario:'ana',nombres:'Ana',apellidos:'Perez',correo:'ana@example.test',contra:password,confirm:password}).subscribe({next:()=>fail('invalid password accepted'),error:()=>{}});
    }
    http.expectNone(base+'auth/create_user'); http.expectNone(base+'auth/csrf');
  });
  it('shares a single account creation between concurrent subscribers', () => {
    const data={usuario:'ana',nombres:'Ana',apellidos:'Perez',correo:'ana@example.test',contra:'a-valid-new-password',confirm:'a-valid-new-password'};
    const request=auth.register(data); const received=jasmine.createSpy('received'); request.subscribe(received); request.subscribe(received);
    bootstrap(); http.expectOne(base+'auth/create_user').flush(authenticated(),{status:201,statusText:'Created'});
    expect(received).toHaveBeenCalledTimes(2);
  });
  it('shares bootstrap and login between repeated calls and multiple subscribers', () => {
    const first = auth.login(credentials); const second = auth.login(credentials);
    const received = jasmine.createSpy('received');
    first.subscribe(received); first.subscribe(received); second.subscribe(received);
    bootstrap(); http.expectOne(base + 'auth/login').flush(authenticated()); expect(received).toHaveBeenCalledTimes(3);
  });
  it('retains the challenge without access and sends challenge_id with a string MFA code', () => {
    auth.login(credentials).subscribe(); bootstrap();
    http.expectOne(base + 'auth/login').flush({status: 'mfa_required', challenge_id: 'challenge-id', expires_in: 180, methods: ['totp']});
    expect(auth.getToken()).toBeNull(); expect(router.navigate).not.toHaveBeenCalled();
    const request = auth.verifyTwoFactor('challenge-id', '012345'); request.subscribe(); request.subscribe();
    const mfa = http.expectOne(base + 'totp/verificar-2fa');
    expect(mfa.request.body).toEqual({challenge_id: 'challenge-id', code: '012345'});
    expect(mfa.request.withCredentials).toBeTrue(); expect(mfa.request.headers.get('X-CSRF-Token')).toBe('bootstrap');
    expect(mfa.request.headers.has('Authorization')).toBeFalse();
    mfa.flush({...authenticated(), csrf_token: 'after-mfa'}); expect(auth.getToken()).toBeTruthy();
    // Exercise the cookie adapter directly to observe the latest in-memory CSRF header.
    auth.security.verifyMfa('consumed-challenge', '012345').subscribe({error: () => {}});
    const rotated = http.expectOne(base + 'totp/verificar-2fa');
    expect(rotated.request.headers.get('X-CSRF-Token')).toBe('after-mfa');
    rotated.flush({error:{code:'INVALID_CHALLENGE',message:'Desafío ya usado'}},{status:401,statusText:'Unauthorized'});
    expect(auth.isAuthenticated()).toBeTrue();
  });
  it('uses the CSRF received after authenticated instead of its bootstrap value', () => {
    auth.login(credentials).subscribe(); bootstrap(); http.expectOne(base + 'auth/login').flush({...authenticated(), csrf_token:'after-login'});
    auth.security.verifyMfa('invalid-challenge','012345').subscribe({error:()=>{}});
    const req=http.expectOne(base+'totp/verificar-2fa'); expect(req.request.headers.get('X-CSRF-Token')).toBe('after-login');
    req.flush({}, {status:400,statusText:'Bad Request'});
  });
  it('surfaces structured 403 details and request reference without retry or redirect', () => {
    auth.login(credentials).subscribe({error: e => {
      const failure=apiFailure(e); expect(failure.code).toBe('FORBIDDEN'); expect(failure.message).toBe('Validación CSRF requerida'); expect(failure.requestId).toBe('test-request-403');
    }}); bootstrap(); http.expectOne(base+'auth/login').flush({error:{code:'FORBIDDEN',message:'Validación CSRF requerida',fields:[],retry_after_seconds:null},request_id:'test-request-403'},{status:403,statusText:'Forbidden'});
    expect(http.match(()=>true).length).toBe(0); expect(router.navigate).not.toHaveBeenCalled(); expect(auth.getToken()).toBeNull();
  });
  it('does not POST when CSRF bootstrap fails', () => {
    auth.login(credentials).subscribe({error:()=>{}}); http.expectOne(base+'auth/csrf').flush({error:{code:'FORBIDDEN',message:'Origen no permitido'}},{status:403,statusText:'Forbidden'});
    http.expectNone(base+'auth/login'); expect(http.match(()=>true).length).toBe(0);
  });
  it('respects login Retry-After without sending another bootstrap or login during cooldown', () => {
    auth.login(credentials).subscribe({error:()=>{}}); bootstrap();
    http.expectOne(base+'auth/login').flush({error:{code:'RATE_LIMITED',message:'Espera antes de volver a intentar'},request_id:'request-429'}, {status:429,statusText:'Too Many Requests',headers:{'Retry-After':'120'}});
    auth.login(credentials).subscribe({next:()=>fail('unexpected login'),error:e=>expect(apiFailure(e).retryAfter).toBeGreaterThan(0)});
    expect(http.match(()=>true).length).toBe(0); expect(router.navigate).not.toHaveBeenCalled();
  });
  it('bootstraps anew on an explicit login attempt after a 403 instead of silently retrying', () => {
    auth.login(credentials).subscribe({error:()=>{}}); bootstrap(); http.expectOne(base+'auth/login').flush({}, {status:403,statusText:'Forbidden'});
    auth.login(credentials).subscribe(); http.expectNone(base+'auth/login'); bootstrap(); http.expectOne(base+'auth/login').flush(authenticated());
  });
  it('never attaches Authorization to third-party domains or an alternative loopback host', () => {
    auth.login(credentials).subscribe(); bootstrap(); http.expectOne(base+'auth/login').flush(authenticated());
    for (const url of ['https://example.test/api', 'http://127.0.0.1:8000/pet/petsByUserLogged']) {
      client.get(url).subscribe(); const req=http.expectOne(url); expect(req.request.headers.has('Authorization')).toBeFalse(); req.flush({});
    }
    client.get(base+'pet/petsByUserLogged').subscribe(); const own=http.expectOne(base+'pet/petsByUserLogged'); expect(own.request.headers.get('Authorization')).toBe('Bearer '+auth.getToken()); own.flush([]);
  });
});


describe('Confirmed refresh at startup', () => {
  let auth: Auth; let http: HttpTestingController; let router: Router;
  beforeEach(() => {
    TestBed.configureTestingModule({providers:[provideZonelessChangeDetection(), provideRouter([]),
      provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting()]});
    auth=TestBed.inject(Auth); http=TestBed.inject(HttpTestingController); router=TestBed.inject(Router);
    spyOn(router,'navigate').and.resolveTo(true);
  });
  afterEach(() => {auth.ngOnDestroy(); http.verify();});
  function csrf(): void {
    const request=http.expectOne(base+'auth/csrf');
    expect(request.request.method).toBe('GET'); expect(request.request.withCredentials).toBeTrue();
    expect(request.request.headers.has('Authorization')).toBeFalse(); request.flush({csrf_token:'bootstrap-refresh'});
  }
  it('shares a single startup restoration with guards and rotates the in-memory credentials', async () => {
    const first=firstValueFrom(auth.restore()); const second=firstValueFrom(auth.restore());
    const guard=firstValueFrom(TestBed.runInInjectionContext(()=>sessionGuard({} as never,{} as never)) as import('rxjs').Observable<unknown>);
    http.expectNone(base+'auth/refresh'); csrf();
    const request=http.expectOne(base+'auth/refresh');
    expect(request.request.method).toBe('POST'); expect(request.request.body).toBeNull();
    expect(request.request.withCredentials).toBeTrue(); expect(request.request.headers.get('X-CSRF-Token')).toBe('bootstrap-refresh');
    expect(request.request.headers.has('Authorization')).toBeFalse();
    request.flush({...authenticated(),csrf_token:'refreshed-csrf'});
    expect(await first).toBeTrue(); expect(await second).toBeTrue(); expect(await guard).toBeTrue();
    expect(auth.getToken()).toBeTruthy(); expect(auth.getCurrentUser()?.id).toBe(7); expect(router.navigate).not.toHaveBeenCalled();
    auth.security.verifyMfa('invalid-probe','012345').subscribe({error:()=>{}});
    const probe=http.expectOne(base+'totp/verificar-2fa'); expect(probe.request.headers.get('X-CSRF-Token')).toBe('refreshed-csrf');
    probe.flush({}, {status:400,statusText:'Bad Request'});
    http.expectNone(base+'auth/login');
  });
  for (const code of ['SESSION_EXPIRED','SESSION_REVOKED','INVALID_TOKEN']) {
    it(`shows login on ${code} without any automatic credentials or repeated refresh`, async () => {
      const result=firstValueFrom(auth.restore()); csrf();
      http.expectOne(base+'auth/refresh').flush({error:{code,message:'Sesión no válida'},request_id:'refresh-401'},{status:401,statusText:'Unauthorized'});
      expect(await result).toBeFalse(); expect(auth.getToken()).toBeNull(); expect(auth.getCurrentUser()).toBeNull();
      expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
      expect(await firstValueFrom(auth.restore())).toBeFalse(); http.expectNone(base+'auth/login'); http.expectNone(base+'auth/refresh');
    });
  }
  it('does not retry a failed CSRF bootstrap or POST refresh after it', async () => {
    const result=firstValueFrom(auth.restore());
    http.expectOne(base+'auth/csrf').flush({error:{code:'FORBIDDEN',message:'Origen no permitido'}},{status:403,statusText:'Forbidden'});
    expect(await result).toBeFalse(); http.expectNone(base+'auth/refresh'); http.expectNone(base+'auth/login');
  });
  it('closes the remote cookie session so a reload cannot undo explicit logout', () => {
    auth.login(credentials).subscribe(); csrf(); http.expectOne(base+'auth/login').flush(authenticated());
    auth.logout(); const request=http.expectOne(base+'auth/logout');
    expect(request.request.body).toBeNull(); expect(request.request.withCredentials).toBeTrue();
    expect(request.request.headers.get('X-CSRF-Token')).toBe('rotated');
    expect(auth.getToken()).toBeNull(); request.flush(null,{status:204,statusText:'No Content'});
  });
});
