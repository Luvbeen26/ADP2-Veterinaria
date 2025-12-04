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


export interface ConsultaBase {
  id_cita: number;
  motivo: string;
  diagnostico?: string | null;
  observaciones?: string | null;
  tratamiento?: string | null;
  medicacion?: string | null;
}

//export interface ConsultaCreate extends ConsultaBase {
export interface ConsultaCreate {
  motivo:string
  diagnostico?:string;
  observaciones?:string;
  tratamientos?:tratamiento[];
  cuidados?:cuidados[];
}

export interface ConsultaUpdate {
  motivo?: string | null;
  diagnostico?: string | null;
  observaciones?: string | null;
  tratamiento?: string | null;
  medicacion?: string | null;
}

export interface ConsultaResponse extends ConsultaBase {
  id_consulta: number;
  cita?: citas | null;
}
export interface ResumenResponse{
    resumen:string
}

export interface tratamiento{
  tipo:string;
  descripcion:string;
}

export interface cuidados{
  id:number;
  descripcion:string;
}

export interface cuidadosWithSpecie extends cuidados{
  especie:string;
}

