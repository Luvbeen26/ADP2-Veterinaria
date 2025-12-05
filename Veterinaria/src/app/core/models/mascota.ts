import { ColorOut } from "./color";
import { Raza } from "./raza";

export interface MascotaBase {
  nombre: string;
  fecha_nacimiento: string;
  especie: string;
  sexo: string;
  id_raza?: number;
  id_color?: number;
  peso?: number;
  activo?: boolean;
  resumen_IA:string;
}

export interface MascotaCreate extends MascotaBase {}

export interface MascotaCreatewithID extends MascotaBase {
  id_user:number
}

export interface MascotaUpdate {
  nombre?: string;
  fecha_nacimiento?: string;
  especie?: string;
  sexo?: string;
  id_raza?: number;
  id_color?: number;
  peso?: number;
  activo?: boolean;
  resumen_IA?:string;
}

export interface MascotaOut extends MascotaBase {
  id_usuario: number;
  id_mascota: number;
  raza_mascota?: Raza | null;
  color?: ColorOut | null;
}
export interface MascotaDeleteResponse{
  detail: string;
}


export interface MascotasGetByUser{
  id:number,
  nombre:string
  especie:string
}

export interface Propietario {
  nombre: string;
  apellidos: string;
  correo_electronico: string;
}

export interface ConsultaItem {
  fecha: string;        
  motivo: string;
  diagnostico: string;
  tratamiento: string;
  veterinario: string;  
}

export interface CartillaMascotaOut {
  id_usuario: number;
  id_mascota: number;
  nombre: string;
  especie: string;
  fecha_nacimiento: string;
  sexo: string;
  raza_mascota?: Raza | null;
  color?: ColorOut | null;
  peso: number;
  activo: boolean;
  resumen_IA: string;
  propietario: Propietario;
  consultas: ConsultaItem[];
}

export interface GetCita{
  id_cita:number;
  id_mascota:number;
  id_vet : number,
  vet_name: string,
  pet_name:string;
  especie:string;
}