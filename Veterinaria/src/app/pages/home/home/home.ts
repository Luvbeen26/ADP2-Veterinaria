import { Component, inject, signal } from '@angular/core';
import { ServiceHome } from '../../../shared/components/service-home/service-home';
import { cardService } from '../../../core/models/service';
import {MatIcon, MatIconModule} from '@angular/material/icon'
import { Mascota } from '../../../core/services/mascota/mascota';
import { Auth } from '../../../core/services/auth/auth';
import { Consulta } from '../../../core/services/vet/consulta';
import { GetRecomendaciones } from '../../../core/models/mascota';

@Component({
  selector: 'app-home',
  imports: [ServiceHome,MatIcon],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home {
  consultaService=inject(Consulta)
  authService=inject(Auth)

  mascotas_recomendaciones=signal<GetRecomendaciones[] | null>(null)

  
  servicios:cardService[] = [
    {service: 'Consulta',title:"Consulta Medica",description: 'Revisiones completas, vacunas y desparacitacion para el bienestar de tu mascota'},
    {service: 'Salon',title:"Salon de Cuidados",description: 'Baños, cortes de pelo, corte de uñas aseo bucal'},
    {service: 'Adopcion',title:"Adopcion",description: 'Llevate a uno de nuestros amigos que necesitan quien cuide de ellos.'}
  ];

  ngOnInit(){
    const userData=this.authService.getCurrentUser()
    if(userData){
      this.consultaService.GetRecomendaciones().subscribe({
        next:res=>{
          this.mascotas_recomendaciones.set(res)
        }
      })
    }

    
  }
}
