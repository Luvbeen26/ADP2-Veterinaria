import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { App } from './app';
import { appConfig } from './app.config';
import { Auth } from './core/services/auth/auth';

const base = 'http://localhost:8000/';

describe('Application session initialization', () => {
  let http: HttpTestingController; let router: Router;
  beforeEach(() => {
    TestBed.configureTestingModule({imports:[App], providers:[...appConfig.providers, provideHttpClientTesting()]});
    http = TestBed.inject(HttpTestingController); router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
  });
  afterEach(() => http.verify());
  function csrf(): void {
    const request = http.expectOne(base+'auth/csrf'); expect(request.request.withCredentials).toBeTrue();
    request.flush({csrf_token:'initial-csrf'});
  }
  it('restores identity before rendering the Header and does not duplicate startup requests', async () => {
    const initializer = TestBed.inject(ApplicationInitStatus); expect(initializer.done).toBeFalse();
    csrf(); const request = http.expectOne(base+'auth/refresh');
    expect(request.request.body).toBeNull(); expect(request.request.withCredentials).toBeTrue();
    expect(request.request.headers.get('X-CSRF-Token')).toBe('initial-csrf');
    const stamp = Math.floor(Date.now()/1000);
    const payload = {sub:'7',sid:'session-1',jti:'test-jti',token_use:'access',iat:stamp,nbf:stamp,exp:stamp+900,iss:'test',aud:'test'};
    request.flush({status:'authenticated',access_token:`e30.${btoa(JSON.stringify(payload))}.signature`,token_type:'bearer',expires_in:900,
      session_id:'session-1',csrf_token:'rotated-csrf',user:{id_usuario:7,usuario:'ana',nombre:'Ana',apellidos:'Perez',correo_electronico:'ana@example.test',rol:'C',twofa_habilitado:false,permissions:[]}});
    await initializer.donePromise;
    const fixture = TestBed.createComponent(App); await fixture.whenStable();
    expect(TestBed.inject(Auth).isAuthenticated()).toBeTrue();
    expect(fixture.nativeElement.querySelector('a[href="/profile"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/auth/login"]')).toBeNull();
    http.expectNone(base+'auth/refresh'); http.expectNone(base+'auth/login');
  });
  it('finishes initialization on expired session and requests the login screen without posting credentials', async () => {
    const initializer = TestBed.inject(ApplicationInitStatus); csrf();
    http.expectOne(base+'auth/refresh').flush({error:{code:'SESSION_EXPIRED',message:'Sesión caducada'}},{status:401,statusText:'Unauthorized'});
    await initializer.donePromise;
    expect(TestBed.inject(Auth).isAuthenticated()).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
    http.expectNone(base+'auth/login'); http.expectNone(base+'auth/refresh');
  });
});
