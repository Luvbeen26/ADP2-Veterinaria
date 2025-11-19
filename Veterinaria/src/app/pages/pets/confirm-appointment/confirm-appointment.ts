import { Component, inject } from '@angular/core';
import { MatIcon, MatIconModule } from "@angular/material/icon";
import { Router } from '@angular/router';
import { CitaCreate } from '../../../core/models/cita';
import { CommonModule } from '@angular/common';
import { CitaService } from '../../../core/services/vet/cita-service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-confirm-appointment',
  imports: [MatIconModule, CommonModule, FormsModule],
  templateUrl: './confirm-appointment.html',
  styleUrl: './confirm-appointment.css'
})
export class ConfirmAppointment {

  private citasService = inject(CitaService);
  private router = inject(Router);
  datos?: any;

  ngOnInit(): void {
    const navigation = this.router.lastSuccessfulNavigation;
    this.datos = navigation?.extras.state?.['datos'];
    console.log(this.datos);
    if (!this.datos) {
      this.router.navigate(['/pets/appointment']);
    }
  }

  confirmarCita() {
  
  if (!this.datos) {
    console.log("Error", this.datos)
    return;
  }
    

  const cita: CitaCreate = {
    servicio: this.datos.servicio,
    id_mascota: Number(this.datos.id_mascota),
    fecha: this.datos.fecha,
    hora: this.datos.hora,
    id_veterinario: Number(this.datos.id_veterinario),
    estado: this.datos.estado,
    notas: this.datos.notas
  };
  console.log(cita);

  this.citasService.createCita(cita).subscribe({
    next: (resp) => {
      console.log("Cita creada", resp);
      this.router.navigate(['/pets/myappointments'], {
        state: { cita: resp }
      });
    },
    error: (err) => {
      console.log("Error al crear cita", err);
    }
  });
}


}
