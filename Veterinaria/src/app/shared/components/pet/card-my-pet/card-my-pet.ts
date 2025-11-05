import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-card-my-pet',
  imports: [],
  templateUrl: './card-my-pet.html',
  styleUrl: './card-my-pet.css'
})
export class CardMyPet {

  @Input() name = '';
  @Input() especie = '';
}
