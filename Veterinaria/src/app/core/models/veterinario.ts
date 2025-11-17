import { UserOut } from "./auth";

export interface VeterinarioBase {
  id_veterinario: number;
  usuario?: UserOut;
}

export interface VeterinarioOut extends VeterinarioBase{}