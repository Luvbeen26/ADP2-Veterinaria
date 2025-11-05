export interface MascotaBase {
  nombre: string;
  fecha_nacimiento: string;
  especie: string;
  sexo: string;
  id_raza?: number;
  color?: string;
  peso?: number;
  activo?: boolean;
}

export interface MascotaCreate extends MascotaBase {}

export interface MascotaUpdate {
  nombre?: string;
  fecha_nacimiento?: string;
  especie?: string;
  sexo?: string;
  id_raza?: number;
  color?: string;
  peso?: number;
  activo?: boolean;
}

export interface MascotaOut extends MascotaBase {
  id_usuario: number;
  id_mascota: number;
}
