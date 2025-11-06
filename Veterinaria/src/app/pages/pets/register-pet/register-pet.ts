import { ChangeDetectorRef, Component, NgZone } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ɵInternalFormsSharedModule, ReactiveFormsModule } from '@angular/forms';
import { Raza } from '../../../core/models/raza';
import { RazaService } from '../../../core/services/mascota/raza';
import { Mascota } from '../../../core/services/mascota/mascota';
import { Toast } from "../../../shared/components/toast/toast";
import { ActivatedRoute, Router } from '@angular/router';

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
  titulo = 'Registrar Mascota';
  idMascota?: number;

  constructor(private fb: FormBuilder, private razaService: RazaService, private mascotaService:Mascota, private zone: NgZone, private cdr: ChangeDetectorRef, private router:Router, private route:ActivatedRoute) {}

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

    this.idMascota = Number(this.route.snapshot.paramMap.get('id'));

    if (this.idMascota) {
      this.titulo = 'Editar Mascota';
      this.cargarMascota(this.idMascota);
    }
  }

  cargarRazas(especie?: string, idRazaSeleccionada?: number) {
  this.razaService.getRazas(especie).subscribe({
    next: (data) => {
      this.razas = data;

      if (this.razas.length > 0) {
        this.isRazaDisabled = false;
        this.mascotaForm.get('id_raza')?.enable();

        if (idRazaSeleccionada) {
          this.mascotaForm.patchValue({ id_raza: idRazaSeleccionada });
        }
      } else {
        this.isRazaDisabled = true;
        this.mascotaForm.get('id_raza')?.disable();
      }
    },
    error: (err) => console.error('Error al cargar razas', err)
  });
}

cargarMascota(id: number) {
  this.mascotaService.getMascotaById(id).subscribe({
    next: (data) => {
      this.mascotaForm.patchValue({
        nombre: data.nombre,
        especie: data.especie,
        fecha_nacimiento: data.fecha_nacimiento,
        sexo: data.sexo,
        color: data.color,
        peso: data.peso
      });

      if (data.especie) {
        this.cargarRazas(data.especie, data.id_raza);
      }
    },
    error: (err) => {console.log('Error al cargar mascota', err)
       if (err.status === 404) {
        this.router.navigate(['/pets']); // redirige si el estatus es 404
      } else {
        console.error(err);
      }
    }
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

    if (this.idMascota) {
      if (!this.mascotaForm.dirty) {
        this.showSuccess('No se detectaron cambios para actualizar 🐶');
        return;
      }
      this.mascotaService.updateMascota(this.idMascota, mascotaData).subscribe({
        next: () => {
          this.showSuccess('Mascota actualizada correctamente 🐾');
          setTimeout(() => this.router.navigate(['/pets']), 2500);
        },
        error: (err) => console.error(err)
      });
    } else {
      // 🟢 CREAR
      this.mascotaService.RegisterMascota(mascotaData).subscribe({
        next: () => {
          this.showSuccess('Mascota registrada correctamente 🐾');
          setTimeout(() => this.router.navigate(['/pets']), 2500);
        },
        error: (err) => console.error(err)
      });
    }
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
