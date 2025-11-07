import { Component, inject, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { Consulta } from '../../../../core/services/vet/consulta';
import { Router } from '@angular/router';

@Component({
  selector: 'app-card-consulta',
  imports: [MatIconModule],
  templateUrl: './card-consulta.html',
  styleUrl: './card-consulta.css'
})
export class CardConsulta {
  consultService=inject(Consulta)
  router=inject(Router)
  @Input() id_cita!:number
  @Input() service!:string
  @Input() usuario!:string
  @Input() hora!:string
  @Input() id_pet!:number
  @Input() mascota!:string
  @Input() especie!:string

  

  servicio="Consulta General"

  Mark_Asistido(){
    this.consultService.Mark_accept_cita(this.id_cita).subscribe({
      next: (res) => {
        this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
          this.router.navigate(['/vet']);
        });
      } ,
      error: (err) => console.log(err)
    })
  }
  
  Mark_NOAsistido(){
    this.consultService.Mark_refuse_cita(this.id_cita).subscribe({
      next: (res) => {
        this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
          this.router.navigate(['/vet']);
        });
      } ,
      error: (err) => console.log(err)
    })
  }
}
