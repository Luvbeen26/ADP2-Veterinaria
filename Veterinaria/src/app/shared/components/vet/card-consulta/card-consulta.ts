import { Component, inject, Input, Output, EventEmitter } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Consulta } from '../../../../core/services/vet/consulta';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { citas } from '../../../../core/models/consultas';
import { Auth } from '../../../../core/services/auth/auth';
import { CitaService } from '../../../../core/services/vet/cita-service';
import { ConfirmDialogComponent } from '../../confirm-dialog/confirm-dialog';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltip } from "@angular/material/tooltip";

@Component({
  selector: 'app-card-consulta',
  imports: [MatIconModule, RouterModule],
  templateUrl: './card-consulta.html',
  styleUrl: './card-consulta.css'
})
export class CardConsulta {
  consultService=inject(Consulta)
  authService=inject(Auth)
  citaService=inject(CitaService)
  router=inject(Router)
  @Input() cardconsulta!:citas
  @Input() status!:string
  @Output() citaCancelada = new EventEmitter<number>();

  
  constructor(private dialog:MatDialog){}
  servicio="Consulta General"

  ngOnInit(){
    console.log(this.cardconsulta.servicio)
  }

/*
  Mark_Asistido(){
    this.consultService.Mark_accept_cita(this.cardconsulta.id_cita).subscribe({
      next: (res) => {
        this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
          this.router.navigate(['/vet']);
        });
      } ,
      error: (err) => console.log(err)
    })
  }*/
  
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

  cancelarCita(id_cita:number){
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
          width: '320px',
          data: {
            title: 'Confirmar cancelación',
            message: `¿Estás seguro de cancelar esta cita?`
          },
          enterAnimationDuration: '200ms',
          exitAnimationDuration: '200ms'
        });
            dialogRef.afterClosed().subscribe(result => {
      if (result && id_cita) {
   this.citaService.cancelarCita(id_cita).subscribe({
      next:(data)=>{
      console.log(data)
      this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
      this.router.navigate(['/pets/myappointments']);
    });
    },
      error:(err)=>{
      console.log(err)
      }
    });
    }
    })
}
}
