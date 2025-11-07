import { Routes } from "@angular/router";
import { MyPets } from "./my-pets/my-pets";
import { RegisterPet } from "./register-pet/register-pet";
import { Appointment } from "./appointment/appointment";

export const PETS_ROUTES : Routes = [
    {path:'', component: MyPets},   
    {path:'register-pet', component: RegisterPet},
    {path: 'edit-pet/:id', component: RegisterPet },
    {path: 'appointment', component:Appointment}

]