import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { CardConsulta } from '../../../shared/components/vet/card-consulta/card-consulta';
import { response } from 'express';
import { Consulta } from '../../../core/services/vet/consulta';
import { citas } from '../../../core/models/consultas';
import { MatIconModule } from '@angular/material/icon';
import { catchError, map, Observable, of } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-consultas',
  imports: [CardConsulta,MatIconModule,CommonModule],
  templateUrl: './consultas.html',
  styleUrl: './consultas.css'
})
export class Consultas {
  consultaService=inject(Consulta)
  citas:citas[]=[];
  dates$!: Observable<any[]>;


  meses = [
    "Enero", "Febrero", "Marzo", "Abril",
    "Mayo", "Junio", "Julio", "Agosto",
    "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];
  ngOnInit(){
    this.get_pendients()

  }

  get_pendients() {
    this.dates$ = this.consultaService.get_pendient_citas().pipe(
      map((response: citas[]) => {
        // Agrupar por fecha
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
        console.error("ERROR AL OBTENER CITAS")
        return of([])
      }

      )
    );
  }

  transformDate(date:String):string{
    const partes=date.split("-")
    const fecha = `${parseInt(partes[2])} de ${this.meses[parseInt(partes[1]) - 1]} de ${partes[0]}`;
    return fecha
  }
}
