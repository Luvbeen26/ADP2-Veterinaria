import { Component, ElementRef, HostListener, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { ZERO_TRUST_ENABLED } from '../../../core/security/contracts';
import { Auth } from '../../../core/services/auth/auth';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header {
  private readonly secure = inject(ZERO_TRUST_ENABLED);
  canAccess(permission: string): boolean {return !this.secure || this.auth.hasPermission(permission);}
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly currentUser$ = this.auth.currentUser$;
  readonly menuOpen = signal(false);
  readonly currentPath = signal(this.router.url.split(/[?#]/)[0]);

  @ViewChild('menuToggle') private menuToggle?: ElementRef<HTMLButtonElement>;

  constructor() {
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      takeUntilDestroyed()
    ).subscribe(event => {
      this.currentPath.set(event.urlAfterRedirects.split(/[?#]/)[0]);
      this.closeMenu();
    });
  }

  toggleMenu(): void { this.menuOpen.update(open => !open); }
  closeMenu(): void { this.menuOpen.set(false); }

  @HostListener('document:keydown.escape')
  closeMenuWithKeyboard(): void {
    if (this.menuOpen()) {
      this.closeMenu();
      this.menuToggle?.nativeElement.focus();
    }
  }

  @HostListener('document:click', ['$event'])
  closeMenuOutside(event: MouseEvent): void {
    if (this.menuOpen() && !this.host.nativeElement.contains(event.target as Node)) this.closeMenu();
  }

  isPetsSection(): boolean {
    const path = this.currentPath();
    return path === '/pets' || path.startsWith('/pets/register-pet') || path.startsWith('/pets/edit-pet/');
  }

  isConsultationsSection(): boolean {
    const path = this.currentPath();
    return path === '/vet' || path === '/vet/registrar-consulta' || path.startsWith('/vet/registrar-consulta/') || path.startsWith('/vet/edit-appointment/');
  }

  isUsersSection(): boolean {
    const path = this.currentPath();
    return path === '/vet/users-list' || path.startsWith('/vet/medical-history/') || path.startsWith('/vet/register-pet-foruser/');
  }

  isAppointmentsSection(): boolean {
    const path = this.currentPath();
    return path === '/pets/myappointments' || path.startsWith('/pets/edit-appointment/');
  }

  isServicesSection(): boolean {
    const path = this.currentPath();
    return path === '/services' || path === '/pets/appointment' || path === '/pets/confirm-appointment';
  }

  log_out(): void {
    this.closeMenu();
    this.auth.logout();
    void this.router.navigate(['/']);
  }
}
