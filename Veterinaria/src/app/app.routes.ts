import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth/auth-cliente-guard';

export const routes: Routes = [
    {
        path: '', loadChildren: ()=> import('./pages/auth/auth.routes').then(m=> m.AUTH_ROUTES)
    },
    {
        path: 'services', loadChildren: ()=>import('./pages/vet-services/vet-services.routes').then(m=>m.VET_SERVICES)
    },
    {
        path: 'pets',canActivate:[authGuard],loadChildren: ()=>import('./pages/pets/pets.routes').then(m=>m.PETS_ROUTES)
    }
];
