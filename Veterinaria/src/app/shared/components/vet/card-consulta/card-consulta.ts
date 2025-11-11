import { Component, inject, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { Consulta } from '../../../../core/services/vet/consulta';
import { Router } from '@angular/router';
import { citas } from '../../../../core/models/consultas';

@Component({
  selector: 'app-card-consulta',
  imports: [MatIconModule],
  templateUrl: './card-consulta.html',
  styleUrl: './card-consulta.css'
})
export class CardConsulta {
  consultService=inject(Consulta)
  router=inject(Router)
  @Input() cardconsulta!:citas
  @Input() status!:string
  

  servicio="Consulta General"

  ngOnInit(){
    console.log(this.cardconsulta.servicio)
  }

  Mark_Asistido(){
    this.consultService.Mark_accept_cita(this.cardconsulta.id_cita).subscribe({
      next: (res) => {
        this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
          this.router.navigate(['/vet']);
        });
      } ,
      error: (err) => console.log(err)
    })
  }
  
  Mark_NOAsistido(){
    this.consultService.Mark_refuse_cita(this.cardconsulta.id_cita).subscribe({
      next: (res) => {
        this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
          this.router.navigate(['/vet']);
        });
      } ,
      error: (err) => console.log(err)
    })
  }
}
