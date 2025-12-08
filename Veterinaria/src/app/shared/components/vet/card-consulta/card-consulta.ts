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

  getNotasParsed(raw: any) {
    if (!raw) return null;

    let notas: any;

    try {
        // Si ya es objeto
        if (typeof raw === "object") {
            notas = raw;
        } else {
            // Si viene como string JSON
            notas = JSON.parse(raw);
        }
    } catch {
        return null; // cadena inválida → no rompe el front
    }

    return {
        estadoGeneral: notas.estadoGeneral ?? "No especificado",
        sintomas: Array.isArray(notas.sintomas) ? notas.sintomas : [],
        medicamentos: notas.medicamentos ?? "No especificado",
        observaciones: notas.observaciones ?? "No especificado",
        duracionSintomas: notas.duracionSintomas ?? null
    };
}

formatDuracion(duracion: string): string {
  if (!duracion) return "";

  const map: any = {
    "mas_3_dias": "Más de 3 días",
    "menos_24_horas": "Menos de 24 horas",
    "1_2_dias": "1 a 2 días",
    "2_3_dias": "2 a 3 días"
  };

  // Si existe en el mapa → lo devuelve bonito
  if (map[duracion]) return map[duracion];

  // Si no existe, lo convierte de forma genérica: mas_3_dias → Mas 3 dias
  return duracion
    .replace(/_/g, " ")
    .replace(/\b\w/g, letra => letra.toUpperCase());
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
