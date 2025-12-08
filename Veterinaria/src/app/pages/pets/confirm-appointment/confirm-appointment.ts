import { Component, inject } from '@angular/core';
import { MatIconModule } from "@angular/material/icon";
import { Router } from '@angular/router';
import { CitaCreate } from '../../../core/models/cita';
import { CommonModule } from '@angular/common';
import { CitaService } from '../../../core/services/vet/cita-service';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../core/services/extra/toast-service';

@Component({
  selector: 'app-confirm-appointment',
  imports: [MatIconModule, CommonModule, FormsModule],
  templateUrl: './confirm-appointment.html',
  styleUrl: './confirm-appointment.css'
})
export class ConfirmAppointment {

  private citasService = inject(CitaService);
  private router = inject(Router);
  private toast = inject(ToastService);

  datos?: any;
  isFinalized = false;
  step = 1;

  datosWizard = {
    estadoGeneral: null as string | null,
    sintomas: [] as string[],
    medicamentos: null as string | null,
    duracionSintomas: null as string | null,
    notas: ""
  };

  ngOnInit(): void {
    const navigation = this.router.lastSuccessfulNavigation;
    this.datos = navigation?.extras.state?.['datos'];
    if (!this.datos) {
      this.router.navigate(['/pets/appointment']);
    }
  }

  /** Marca síntomas en datosWizard */
  toggleSintoma(nombre: string, event: any) {
    if (event.target.checked) {
      this.datosWizard.sintomas.push(nombre);
    } else {
      this.datosWizard.sintomas = this.datosWizard.sintomas.filter(s => s !== nombre);
    }
  }

  /** Finaliza y genera las notas */
  finalizarNotas() {
    console.log("kdkhk");
    this.isFinalized = true;

    this.datosWizard.notas = JSON.stringify({
      estadoGeneral: this.datosWizard.estadoGeneral ?? '',
      sintomas: this.datosWizard.sintomas ?? [],
      medicamentos: this.datosWizard.medicamentos ?? '',
      duracionSintomas: this.datosWizard.duracionSintomas ?? '',
    });
  }

  confirmarCita() {

    const cita: CitaCreate = {
      servicio: this.datos.servicio,
      id_mascota: Number(this.datos.id_mascota),
      fecha: this.datos.fecha,
      hora: this.datos.hora,
      id_veterinario: Number(this.datos.id_veterinario),
      estado: this.datos.estado,
      notas: this.datosWizard.notas
    };

    this.citasService.createCita(cita).subscribe({
      next: (resp) => {
        this.toast.showAfterRedirect('Su cita se ha agendado correctamente para la fecha ' + cita.fecha);
        this.router.navigate(['/pets/myappointments'], { state: { cita: resp } });
      },
      error: (err) => console.log("Error al crear cita", err)
    });
  }
}
