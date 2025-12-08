export interface ColorBase {
  descripcion: string;
  especie: 'G' | 'P' | 'PG';
}
export interface ColorOut extends ColorBase {
  id_color: number;
}

export interface WizardData {
  estadoGeneral: string;
  sintomas: string[];
  medicamentos: string;
  observaciones: string;
}
