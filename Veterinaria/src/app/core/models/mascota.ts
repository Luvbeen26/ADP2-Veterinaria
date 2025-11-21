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