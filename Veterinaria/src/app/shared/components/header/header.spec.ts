import { Component, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { Auth } from '../../../core/services/auth/auth';
import { UserData } from '../../../core/models/auth';
import { Header } from './header';

@Component({ template: '' })
class Destination {}

describe('Header navigation', () => {
  let fixture: ComponentFixture<Header>;
  let router: Router;
  let user: BehaviorSubject<UserData | null>;
  let logout: jasmine.Spy;
  const account = (rol: string) => ({ rol, nombre: 'Usuario de prueba' } as UserData);
  const links = () => Array.from(fixture.nativeElement.querySelectorAll('.primary-links a')) as HTMLAnchorElement[];
  const active = () => links().filter(link => link.getAttribute('aria-current') === 'page').map(link => link.textContent?.trim());
  const render = async () => { fixture.detectChanges(); await fixture.whenStable(); fixture.detectChanges(); };

  beforeEach(async () => {
    user = new BehaviorSubject<UserData | null>(null);
    logout = jasmine.createSpy('logout');
    await TestBed.configureTestingModule({
      imports: [Header],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([{ path: '**', component: Destination }]),
        { provide: Auth, useValue: { currentUser$: user.asObservable(), logout } }
      ]
    }).compileComponents();
    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(Header);
    await router.navigateByUrl('/');
    await render();
  });

  it('shows only Inicio to guests while retaining authentication destinations', () => {
    expect(links().map(link => link.getAttribute('href'))).toEqual(['/']);
    expect(fixture.nativeElement.querySelector('a[href="/auth/login"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/auth/register"]')).toBeTruthy();
  });

  it('shows the customer destinations and account actions', async () => {
    user.next(account('C')); await render();
    expect(links().length).toBe(4);
    expect(fixture.nativeElement.querySelector('a[href="/profile"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/auth/login"]')).toBeNull();
  });

  it('shows only the three veterinarian modules without changing the profile destination', async () => {
    user.next(account('V')); await render();
    expect(links().map(link => link.getAttribute('href'))).toEqual(['/vet', '/vet/users-list', '/vet/statistics']);
    expect(fixture.nativeElement.querySelector('.brand').getAttribute('href')).toBe('/vet');
    expect(fixture.nativeElement.querySelector('a[href="/profile"]')).toBeTruthy();
  });

  it('highlights Mis citas without also highlighting Mascotas', async () => {
    user.next(account('C')); await router.navigateByUrl('/pets/myappointments'); await render();
    expect(active()).toEqual(['Mis citas']);
  });

  it('keeps Mascotas active when editing a pet', async () => {
    user.next(account('C')); await router.navigateByUrl('/pets/edit-pet/10'); await render();
    expect(active()).toEqual(['Mascotas']);
  });

  it('does not highlight Consultas when Statistics is active', async () => {
    user.next(account('V')); await router.navigateByUrl('/vet/statistics'); await render();
    expect(active()).toEqual(['Estadísticas']);
  });

  it('exposes and toggles the disclosure state', async () => {
    const button = fixture.nativeElement.querySelector('.menu-toggle') as HTMLButtonElement;
    expect(button.getAttribute('aria-expanded')).toBe('false');
    button.click(); await render();
    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(fixture.nativeElement.querySelector('.navigation--open')).toBeTruthy();
  });

  it('closes the menu after navigation', async () => {
    fixture.componentInstance.toggleMenu();
    await router.navigateByUrl('/services'); await render();
    expect(fixture.componentInstance.menuOpen()).toBeFalse();
  });

  it('closes the menu with Escape', async () => {
    fixture.componentInstance.toggleMenu(); await render();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await render();
    expect(fixture.componentInstance.menuOpen()).toBeFalse();
  });

  it('closes when clicking outside the header', async () => {
    fixture.componentInstance.toggleMenu(); await render();
    document.body.click(); await render();
    expect(fixture.componentInstance.menuOpen()).toBeFalse();
  });

  it('calls the existing logout service', async () => {
    user.next(account('C')); await render();
    fixture.nativeElement.querySelector('.logout-button').click();
    expect(logout).toHaveBeenCalledTimes(1);
  });
  for (const [rol, path, section] of [
    ['V', '/vet/registrar-consulta/1', 'Consultas'],
    ['V', '/vet/edit-appointment/1', 'Consultas'],
    ['V', '/vet/medical-history/1', 'Usuarios'],
    ['V', '/vet/register-pet-foruser/7', 'Usuarios'],
    ['C', '/pets/edit-appointment/1', 'Mis citas'],
    ['C', '/pets/appointment', 'Servicios'],
    ['C', '/pets/confirm-appointment', 'Servicios']
  ]) {
    it(`keeps ${section} active in ${path}`, async () => {
      user.next(account(rol)); await router.navigateByUrl(path); await render();
      expect(active()).toEqual([section]);
    });
  }

});
