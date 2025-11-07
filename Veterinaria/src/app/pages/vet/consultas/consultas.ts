import { Component } from '@angular/core';
import { CardConsulta } from '../../../shared/components/vet/card-consulta/card-consulta';

@Component({
  selector: 'app-consultas',
  imports: [CardConsulta],
  templateUrl: './consultas.html',
  styleUrl: './consultas.css'
})
export class Consultas {
  date="Martes 30 de Septiembre de 2025"
}
