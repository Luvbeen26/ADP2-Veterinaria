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
    {path:'statistics', component:Estadisticas},
    {path:'users-list',component:Users},
    { 
        path: 'register-pet-foruser/:id',
        loadComponent: () => import('../pets/register-pet/register-pet').then(m => m.RegisterPet),
        data: { mode: 'register-byuser' }
    },
    {path:'registrar-consulta',component:RegConsulta},
    {path:'registrar-consulta/:id',component:RegConsulta},
    {path: 'edit-appointment/:id', component:Appointment}
]