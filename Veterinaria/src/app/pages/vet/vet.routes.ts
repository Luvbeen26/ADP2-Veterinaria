import { Routes } from "@angular/router";
import { Consultas } from "./consultas/consultas";
import { HistorialMedico } from "./historial-medico/historial-medico";



export const VET_ROUTES:Routes = [
    {path: '', component: Consultas},
    {path:'medical-history/:id', component:HistorialMedico}
]