import { Component } from '@angular/core';
import { ServiceHome } from '../../../shared/components/service-home/service-home';
import { cardService } from '../../../core/models/service';
import {MatIcon, MatIconModule} from '@angular/material/icon'

@Component({
  selector: 'app-home',
  imports: [ServiceHome,MatIcon],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home {
  servicios:cardService[] = [
    {service: 'Consulta',title:"Consulta Medica",description: 'Revisiones completas, vacunas y desparacitacion para el bienestar de tu mascota'},
    {service: 'Salon',title:"Salon de Cuidados",description: 'Baños, cortes de pelo, corte de uñas aseo bucal'},
    {service: 'Adopcion',title:"Adopcion",description: 'Llevate a uno de nuestros amigos que necesitan quien cuide de ellos.'}
  ];
}
