import { Component, CUSTOM_ELEMENTS_SCHEMA, AfterViewInit, afterEveryRender } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, ɵInternalFormsSharedModule } from '@angular/forms';
import { MascotaOut } from '../../../core/models/mascota';
import { Mascota } from '../../../core/services/mascota/mascota';
import { Auth } from '../../../core/services/auth/auth';
import { ServiceModel } from '../../../core/models/service';
import { Services } from '../../../core/services/vet/services';
import { ActivatedRoute, Router } from '@angular/router';



@Component({
  selector: 'app-appointment',
  imports: [ReactiveFormsModule],
  standalone:true,
  templateUrl: './appointment.html',
  styleUrl: './appointment.css',
  schemas:[CUSTOM_ELEMENTS_SCHEMA]
})
export class Appointment {
  citaForm!: FormGroup;
  loadingMascotas = false;
  mascotas:MascotaOut[] = [];
  services:ServiceModel[] = [];
  selectedHour: string | null = null;
  
  todayISO = new Date().toISOString().split('T')[0];


  veterinarios = [
    { id: 1, nombre: 'Dr. López' },
    { id: 2, nombre: 'Dra. Rivera' }
  ];

  horasDisponibles = ['9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM'];

  constructor(private fb: FormBuilder, private mascotasService:Mascota, private authService:Auth, private servicesService:Services, private route:ActivatedRoute) {}

  ngOnInit(): void {
    this.citaForm = this.fb.group({
      servicio: ['', Validators.required],
      mascota: [{ value: '', disabled: true }, Validators.required],      
      veterinario: ['', Validators.required],
      fecha: ['', Validators.required],
      hora: ['', Validators.required]
    });
  
    this.authService.currentUser$.subscribe(user=>{
      if (user){
        this.getMascotas();
      }
    })

    this.getServices();
    this.route.queryParams.subscribe(params => {
      const servicioParam = params['service'];
      if (servicioParam) {
        this.citaForm.patchValue({ servicio: servicioParam });
      }
    });
    
  }

  ngAfterViewInit() {
  if (typeof window !== 'undefined') {
    import('cally').then(() => {
      console.log('Cally cargado correctamente.');
    });
  }
}

  
  getMascotas() {
    this.loadingMascotas = true;
    this.mascotasService.getMascotas().subscribe({
      next: (data) => {
        this.mascotas = data;
        this.loadingMascotas = false;
        this.citaForm.get('mascota')?.enable();
      },
      error: (err) => {
        console.error(err);
        this.loadingMascotas = false;
      }
    });
  }

  getServices(){
    this.services = this.servicesService.getServices();
  }


  seleccionarHora(hora: string) {
    this.selectedHour = hora;
    this.citaForm.patchValue({ hora });
  }



  onSubmit() {
    if (this.citaForm.invalid) {
      console.log("Formulario invalido")
      this.citaForm.markAllAsTouched();
      return;
    }
    console.log('Datos de la cita:', this.citaForm.value);
    // Aquí enviarías la cita al backend (por ejemplo con un servicio)
  }
  onFechaSeleccionada(event: any) {
    const fechaSeleccionada =
      event.detail?.value || event.detail || event.target?.value || null;

    if (fechaSeleccionada) {
      console.log('Fecha seleccionada:', fechaSeleccionada);
      this.citaForm.patchValue({ fecha: fechaSeleccionada });
    } else {
      console.warn('No se recibió fecha del calendario:', event);
    }
  }

}