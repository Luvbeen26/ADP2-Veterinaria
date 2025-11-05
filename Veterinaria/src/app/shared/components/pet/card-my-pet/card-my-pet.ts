import { Component, Input } from '@angular/core';
import { MascotaOut, MascotaUpdate } from '../../../../core/models/mascota';

@Component({
  selector: 'app-card-my-pet',
  imports: [],
  templateUrl: './card-my-pet.html',
  styleUrl: './card-my-pet.css'
})
export class CardMyPet {

  @Input() mascota?:MascotaOut;

  public editarMascota(){

  }
  public verDetalles(){

  }

  public eliminarMascota(){

  }

}
