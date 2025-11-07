import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-card-consulta',
  imports: [MatIconModule],
  templateUrl: './card-consulta.html',
  styleUrl: './card-consulta.css'
})
export class CardConsulta {
  dueno="Feliza Fierro"
  hora="14:30"
  servicio="Consulta General"

  
}
