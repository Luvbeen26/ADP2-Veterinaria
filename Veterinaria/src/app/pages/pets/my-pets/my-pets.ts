import { Component } from '@angular/core';
import { CardMyPet } from "../../../shared/components/pet/card-my-pet/card-my-pet";

@Component({
  selector: 'app-my-pets',
  imports: [CardMyPet],
  templateUrl: './my-pets.html',
  styleUrl: './my-pets.css'
})
export class MyPets {

}
