export interface CitaCreate {
  servicio: string;
  id_mascota: number;
  fecha: string; 
  hora: string;  
  id_veterinario: number;
  estado: string; // 'P', 'A' o 'N'
}


export interface CitaUpdate {
  fecha: string; 
  hora: string;  
}

export interface HorasDisponiblesResponse {
  servicio: string;
  fecha: string;
  horas_disponibles: string[];
}
