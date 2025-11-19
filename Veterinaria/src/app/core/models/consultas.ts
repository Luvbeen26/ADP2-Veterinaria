import { UserOut } from "./auth";
import { MascotaOut } from "./mascota";
import { VeterinarioOut } from "./veterinario";


export interface citas{
    servicio:string,
    usuario?: UserOut | null,
    fecha:string,
    hora:string,
    id_cita:number,
    mascota?: MascotaOut | null,
    veterinario?: VeterinarioOut | null,
    estado:string
    notas:string
};

