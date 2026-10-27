import { permissionGuard } from '../../core/guards/auth/session-guard';
import { Routes } from "@angular/router";
import { Consultas } from "./consultas/consultas";
import { HistorialMedico } from "./historial-medico/historial-medico";
import { Estadisticas } from "./estadisticas/estadisticas";
import { Users } from "./users/users";
import { RegConsulta } from "./reg-consulta/reg-consulta";
import { Appointment } from "../pets/appointment/appointment";




export const VET_ROUTES:Routes = [
    {path: '', component: Consultas},
    {path:'medical-history/:id', component:HistorialMedico},
    {path:'statistics', canActivate:[permissionGuard('statistics:read')], component:Estadisticas},
    {path:'users-list',canActivate:[permissionGuard('clients:read')],component:Users},
    { 
        path: 'register-pet-foruser/:id',
        canActivate: [permissionGuard('pets:create_for_client')],
        loadComponent: () => import('../pets/register-pet/register-pet').then(m => m.RegisterPet),
        data: { mode: 'register-byuser' }
    },
    {path:'registrar-consulta',component:RegConsulta},
    {path:'registrar-consulta/:id',component:RegConsulta},
    {path: 'edit-appointment/:id', component:Appointment}
]