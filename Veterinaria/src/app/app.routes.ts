import { sessionGuard, auditGuard } from './core/guards/auth/session-guard';
import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth/auth-cliente-guard';
import { authVeterinarioGuard } from './core/guards/auth/auth-veterinario-guard';
import { noauthGuard } from './core/guards/auth/noauth-guard';
import { Home } from './pages/home/home/home';
import { Profile } from './pages/profile/profile';

export const routes: Routes = [
    {
        path: '',component:Home
    },
    {
        path: 'auth',canActivate:[noauthGuard], loadChildren: ()=> import('./pages/auth/auth.routes').then(m=> m.AUTH_ROUTES)
    },
    {
        path: 'services',canActivate:[authGuard], loadChildren: ()=>import('./pages/vet-services/vet-services.routes').then(m=>m.VET_SERVICES)
    },
    {
        path: 'pets',canActivate:[authGuard],loadChildren: ()=>import('./pages/pets/pets.routes').then(m=>m.PETS_ROUTES)
    },
    {
        path: 'vet',canActivate:[authVeterinarioGuard],loadChildren: ()=>import('./pages/vet/vet.routes').then(m=>m.VET_ROUTES)
    },
    {
        path: 'profile', canActivate:[sessionGuard], component:Profile
    },
    {path: 'account/security', canActivate: [sessionGuard], loadComponent: () => import('./pages/security/security-center/security-center').then(m => m.SecurityCenter)},
    {path: 'security/audit', canActivate: [sessionGuard, auditGuard], data: {audit: true}, loadComponent: () => import('./pages/security/security-center/security-center').then(m => m.SecurityCenter)},
    {
        path: '**',redirectTo:"" 
    }
];
