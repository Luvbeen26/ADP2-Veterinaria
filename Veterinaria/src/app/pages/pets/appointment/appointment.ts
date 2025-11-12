import { Component, CUSTOM_ELEMENTS_SCHEMA, AfterViewInit, afterEveryRender, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, ɵInternalFormsSharedModule } from '@angular/forms';
import { MascotaOut } from '../../../core/models/mascota';
import { Mascota } from '../../../core/services/mascota/mascota';
import { Auth } from '../../../core/services/auth/auth';
import { ServiceModel } from '../../../core/models/service';
import { Services } from '../../../core/services/vet/services';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { VetService } from '../../../core/services/vet/vet-service';
import { VeterinarioBase } from '../../../core/models/veterinario';
import { DatePipe, formatDate } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { CitaService } from '../../../core/services/vet/cita-service';
import { CitaCreate, HorasDisponiblesResponse } from '../../../core/models/cita';
import { Toast } from "../../../shared/components/toast/toast";


@Component({
  selector: 'app-appointment',
  imports: [ReactiveFormsModule],
  templateUrl: './appointment.html',
  styleUrl: './appointment.css',
  schemas:[CUSTOM_ELEMENTS_SCHEMA]
})
export class Appointment {
  citaForm!: FormGroup;
  loadingMascotas = false;
  loadingVeterinarios = false;
  mascotas:MascotaOut[] = [];
  services:ServiceModel[] = [];
  veterinarios:VeterinarioBase[] = [];
  selectedHour: string | null = null;
  todayISO = new Date().toISOString().split('T')[0];

  horasDisponibles: string[] = [];

  constructor(private fb: FormBuilder, private mascotasService:Mascota, private authService:Auth, private servicesService:Services, private route:ActivatedRoute, private vetService:VetService, private citaService:CitaService, private cdr: ChangeDetectorRef, private router:Router ) {}

  ngOnInit(): void {
    this.citaForm = this.fb.group({
      servicio: ['', Validators.required],
      mascota: [{ value: '', disabled: true }],   
      veterinario:[{ value: '', disabled: true }],
      fecha: [this.todayISO, Validators.required],
      hora: ['', Validators.required]
    });
  
    this.authService.currentUser$.subscribe(user=>{
      if (user){
        this.getMascotas();
      }
    })

    this.citaForm.get('fecha')?.valueChanges.subscribe(() => this.getHorasCitas());
    this.citaForm.get('servicio')?.valueChanges.subscribe(() => this.getHorasCitas());
    this.getServices();
    this.getVeterinarios();
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

   get fechaFormateada(): string {
      const fecha = this.citaForm.get('fecha')?.value;
      if (!fecha) return '';

      const partes = fecha.split('-');
      const fechaLocal = new Date(
        Number(partes[0]), 
        Number(partes[1]) - 1, 
        Number(partes[2])
      );

      const opciones: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      };

      const texto = fechaLocal.toLocaleDateString('es-ES', opciones);
      return texto.charAt(0).toUpperCase() + texto.slice(1);
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
  
    getHorasCitas() {
    const servicio = this.citaForm.get('servicio')?.value;
    const fecha = this.citaForm.get('fecha')?.value;

    if (!servicio || !fecha) {
      this.horasDisponibles = [];
      this.cdr.detectChanges();
      return;
    }

    this.citaService.obtenerHorasDisponibles(servicio, fecha).subscribe({
      next: (data) => {
        this.horasDisponibles = data.horas_disponibles || [];
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al obtener horas:', err);
        this.horasDisponibles = [];
        this.cdr.detectChanges();
      },
    });
  }


  getVeterinarios(){
    this.vetService.getVeterinarios().subscribe({
      next:(data)=>{
        this.veterinarios = data;
        this.citaForm.get('veterinario')?.enable();
      },
      error:(err)=>{
        console.log(err);
      }
    })
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
    const cita: CitaCreate = {
      servicio: this.citaForm.get('servicio')?.value,
      id_mascota: this.citaForm.get('mascota')?.value || null,
      fecha: new Date(this.citaForm.get('fecha')?.value).toISOString().split('T')[0],
      hora: this.citaForm.get('hora')?.value,    // debe ser 'HH:mm:ss'
      id_veterinario: this.citaForm.get('veterinario')?.value || null,
      estado: 'P'
    };
    console.log('JSON enviado:', JSON.stringify(cita, null, 2));
    this.citaService.createCita(cita).subscribe({
      next:(data)=>{
        console.log(data);
        this.router.navigate(['/pets']);
      },
      error:(err)=>{
        console.log(err);
      }
    });
  }
  onFechaSeleccionada(event: any) {
    const fechaSeleccionada =
    event.detail?.value || event.detail || event.target?.value || null;

    if (fechaSeleccionada) {
      console.log('Fecha seleccionada:', fechaSeleccionada);
      this.citaForm.patchValue({ fecha: fechaSeleccionada });
      this.getHorasCitas();
    } else {
      console.warn('No se recibió fecha del calendario:', event);
    }
  }

  formatearHora(hora: string): string {
    const [horas, minutos] = hora.split(':');
    const fecha = new Date();
    fecha.setHours(+horas, +minutos);
    return fecha.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }
}