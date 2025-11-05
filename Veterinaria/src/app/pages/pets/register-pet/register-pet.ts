import { ChangeDetectorRef, Component, NgZone } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ɵInternalFormsSharedModule, ReactiveFormsModule } from '@angular/forms';
import { Raza } from '../../../core/models/raza';
import { RazaService } from '../../../core/services/mascota/raza';
import { Mascota } from '../../../core/services/mascota/mascota';
import { Toast } from "../../../shared/components/toast/toast";
import { routes } from '../../../app.routes';
import { Route, Router } from '@angular/router';

@Component({
  selector: 'app-register-pet',
  imports: [ɵInternalFormsSharedModule, ReactiveFormsModule, Toast],
  templateUrl: './register-pet.html',
  styleUrl: './register-pet.css'
})
export class RegisterPet {
  mascotaForm!: FormGroup;
  razas: Raza[] = [];
  isRazaDisabled = true;
  showToast = false;
  messageSuccess = '';

  constructor(private fb: FormBuilder, private razaService: RazaService, private mascotaService:Mascota, private zone: NgZone, private cdr: ChangeDetectorRef, private route:Router) {}

  ngOnInit(): void {
    // Inicializamos el formulario reactivo
    this.mascotaForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      especie: ['', Validators.required],
      id_raza: [{ value: '', disabled: true }, Validators.required],
      fecha_nacimiento: ['', Validators.required],
      sexo: ['', Validators.required],
      color: ['', Validators.required],
      peso: ['', Validators.required]
    });

  }

cargarRazas(especie?: string) {
  this.razaService.getRazas(especie).subscribe({
    next: (data) => {
      this.razas = data;
      this.mascotaForm.get('id_raza')?.reset();
      if (this.razas.length > 0) {
        this.isRazaDisabled = false;
        this.mascotaForm.get('id_raza')?.enable();
      } else {
        this.isRazaDisabled = true;
        this.mascotaForm.get('id_raza')?.disable();
      }
    },
    error: (err) => console.error('Error al cargar razas', err)
  });
}

onEspecieChange(especie: string) {
  this.cargarRazas(especie);
}


  onSubmit() {
    if (this.mascotaForm.invalid) {
      this.mascotaForm.markAllAsTouched();
      return;
    }

    const mascotaData = this.mascotaForm.value;
    this.mascotaService.RegisterMascota(mascotaData).subscribe({
      next:(data)=>{
        this.showSuccess('Mascota registrada correctamente 🐾');
        setTimeout(() => {
          this.route.navigate(['/pets']);
        }, 3000);
      },
      error:(err)=>{
        console.log(err)
      }
    })
  }

  showSuccess(message: string) {
    this.zone.run(() => {
      this.messageSuccess = message;
      this.showToast = true;
      this.cdr.detectChanges();

      setTimeout(() => {
        this.showToast = false;
        this.cdr.detectChanges();
      }, 3000);
    });
  }


}
