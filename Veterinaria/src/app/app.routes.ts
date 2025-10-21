import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '', loadChildren: ()=> import('./pages/auth/auth.routes').then(m=> m.AUTH_ROUTES)
    },
    {
        path: 'services', loadChildren: ()=>import('./pages/vet-services/vet-services.routes').then(m=>m.VET_SERVICES)
    },
    {
        path: 'pets', loadChildren: ()=>import('./pages/pets/pets.routes').then(m=>m.PETS_ROUTES)
    }
    
];
