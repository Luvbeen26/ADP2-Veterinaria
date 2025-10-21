import { Routes } from "@angular/router";
import { Login } from "./login/login";
import { Register } from "./register/register";
import { RestorePassword } from "./restore-password/restore-password";

export const AUTH_ROUTES: Routes = [
    {path:'login', component: Login },
    {path:'register',component:Register},
    {path:'restore',component:RestorePassword}
]