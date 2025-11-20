import { Routes } from "@angular/router";
import { Consultas } from "./consultas/consultas";
import { HistorialMedico } from "./historial-medico/historial-medico";
import { Estadisticas } from "./estadisticas/estadisticas";



export const VET_ROUTES:Routes = [
    {path: '', component: Consultas},
    {path:'medical-history/:id', component:HistorialMedico},
    {path:'statistics', component:Estadisticas}
]