import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { CardConsulta } from '../../../shared/components/vet/card-consulta/card-consulta';
import { response } from 'express';
import { Consulta } from '../../../core/services/vet/consulta';
import { citas, ConsultaResponse } from '../../../core/models/consultas';
import { MatIconModule } from '@angular/material/icon';
import { catchError, filter, map, Observable, of, take } from 'rxjs';
import { CommonModule } from '@angular/common';
import { Auth } from '../../../core/services/auth/auth';
import { ToastService } from '../../../core/services/extra/toast-service';
import { error } from 'node:console';

@Component({
  selector: 'app-consultas',
  imports: [CardConsulta,MatIconModule,CommonModule],
  templateUrl: './consultas.html',
  styleUrl: './consultas.css'
})
export class Consultas {
  consultaService=inject(Consulta)
  authService=inject(Auth)
  toast=inject(ToastService)
  citas:citas[]=[];
  citasUrgentes:citas[] = [];
  dates$!: Observable<any[]>;
  status="P"
  empty_title="No hay Consultas Pendientes"
  empty_description="En este momento no tienes consultas programadas. Las nuevas consultas aparecerán aquí."

  meses = [
    "Enero", "Febrero", "Marzo", "Abril",
    "Mayo", "Junio", "Julio", "Agosto",
    "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];
  ngOnInit(){
      this.authService.currentUser$
      .pipe(
        filter(user => !!user), // solo cuando el user ya existe
        take(1)                 // evita múltiples ejecuciones
      )
      .subscribe(() => {
        this.get_pendients();
        this.get_citas_urgentes();
      });
    this.toast.checkRedirectMessage();
  }

  changeStatus(newStatus: string) {
    this.status = newStatus;
    if(this.status == "A" || this.status=="N"){
      this.empty_title="No hay Consultas"
      this.empty_description="En este momento no tienes consultas marcadas con asistencia o no."
    }else if(this.status == "P"){
      this.empty_title="No hay Consultas Pendientes"
      this.empty_description="En este momento no tienes consultas programadas. Las nuevas consultas aparecerán aquí."
    }
    this.get_pendients();
  }

  get_pendients() {
    this.dates$ = this.consultaService.get_pendient_citas(this.status).pipe(
      map((response: citas[]) => {
        const agrupadas: { [fecha: string]: citas[] } = {};

        response.forEach((cita) => {
          if (!agrupadas[cita.fecha]) {
            agrupadas[cita.fecha] = [];
          }
          agrupadas[cita.fecha].push(cita);
        });

        // Convertir a array y transformar fechas
        return Object.keys(agrupadas).map(fecha => ({
          fecha: this.transformDate(fecha),
          citas: agrupadas[fecha]
        }));
      }),
      catchError(err =>{
        if (err.status === 401 || err.status === 0) {
          console.warn('Token no disponible todavía o sin conexión.');
          return of([])
        }
        console.error("ERROR AL OBTENER CITAS", err)
        return of([])
      }

      )
    );
  }

  get_citas_urgentes(){
    this.consultaService.getConsultasUrgentes().subscribe({
      next:(data)=>{
        this.citasUrgentes = data;
        console.log(data)
      },error:(err)=>{
        console.log(err);
      }
    })
  }

  transformDate(date:String):string{
    const partes=date.split("-")
    const fecha = `${parseInt(partes[2])} de ${this.meses[parseInt(partes[1]) - 1]} de ${partes[0]}`;
    return fecha
  }
}
