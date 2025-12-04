import { ChangeDetectorRef, Component, inject, NgZone } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ɵInternalFormsSharedModule, ReactiveFormsModule, NumberValueAccessor } from '@angular/forms';
import { Raza } from '../../../core/models/raza';
import { RazaService } from '../../../core/services/mascota/raza';
import { Mascota } from '../../../core/services/mascota/mascota';
import { Toast } from "../../../shared/components/toast/toast";
import { ActivatedRoute, Router } from '@angular/router';
import { Color } from '../../../core/services/mascota/color';
import { ColorOut } from '../../../core/models/color';
import { Auth } from '../../../core/services/auth/auth';
import { ToastService } from '../../../core/services/extra/toast-service';

@Component({
  selector: 'app-register-pet',
  standalone: true,
  imports: [ɵInternalFormsSharedModule, ReactiveFormsModule],
  templateUrl: './register-pet.html',
  styleUrl: './register-pet.css'
})
export class RegisterPet {
  mascotaForm!: FormGroup;
  colorService=inject(Color)
  authService=inject(Auth)
  toast=inject(ToastService)
  razas: Raza[] = [];
  colors:ColorOut[] = [];
  isRazaDisabled = true;
  showToast = false;
  messageSuccess = '';
  titulo = 'Registrar Mascota';
  idMascota?: number;
  mode!: 'register' | 'register-byuser' | 'edit' ;
  id_user:number | null = null;


  constructor(private fb: FormBuilder, private razaService: RazaService, private mascotaService:Mascota, private zone: NgZone, private cdr: ChangeDetectorRef, private router:Router, private route:ActivatedRoute) {}

  ngOnInit(): void {
    // Inicializamos el formulario reactivo
    this.mascotaForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      especie: ['', Validators.required],
      id_raza: [{ value: '', disabled: true }, Validators.required],
      fecha_nacimiento: ['', Validators.required],
      sexo: ['', Validators.required],
      id_color: [{ value: '', disabled: true }, Validators.required],
      peso: ['', Validators.required]
    });

    this.mode=this.route.snapshot.data["mode"];
    this.getColors();
    if(this.mode == 'register-byuser'){
      this.id_user=Number(this.route.snapshot.paramMap.get('id'));
    }else{
      this.idMascota = Number(this.route.snapshot.paramMap.get('id'));
      if (this.idMascota) {
        this.titulo = 'Editar Mascota';
        this.authService.currentUser$.subscribe(user=>{
        if (user){
          this.cargarMascota(this.idMascota!);
        }
      })
      }  
    }
    
  }

  cargarRazas(especie?: string, idRazaSeleccionada?: number) {
  this.razaService.getRazas(especie).subscribe({
    next: (data) => {
      this.razas = data;

      if (this.razas.length > 0) {
        this.mascotaForm.get('id_raza')?.enable();

        if (idRazaSeleccionada) {
          this.mascotaForm.patchValue({ id_raza: idRazaSeleccionada });
        }
      } else {
        this.mascotaForm.get('id_raza')?.disable();
      }
    },
    error: (err) => console.error('Error al cargar razas', err)
  });
}



cargarMascota(id: number) {
  this.mascotaService.getMascotaById(id).subscribe({
    next: (data) => {
      console.log(data)
      this.mascotaForm.patchValue({
        nombre: data.nombre,
        especie: data.raza_mascota?.especie,
        id_raza: data.raza_mascota?.id_raza,
        fecha_nacimiento: data.fecha_nacimiento,
        sexo: data.sexo,
        id_color:data.color?.id_color,
        peso: data.peso
      });

     if (data.raza_mascota?.especie) {
        this.cargarRazas(data.raza_mascota?.especie, data.raza_mascota.id_raza);
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
      console.log("from invalido");
      console.log(this.mascotaForm);
      this.mascotaForm.markAllAsTouched();
      return;
    }
    const mascotaData = this.mascotaForm.value;
    

    if (this.idMascota) {
      if (!this.mascotaForm.dirty) {
        return;
      }
      this.mascotaService.updateMascota(this.idMascota, mascotaData).subscribe({
        next: () => {
          this.toast.showAfterRedirect('Mascota editada correctamente 🐾');
          this.router.navigate(['/pets']);
        },
        error: (err) => console.error(err)
      });
    } if (this.id_user){
      const mascotawithIDuser = Object.assign({}, this.mascotaForm.value);
      mascotawithIDuser.id_user=this.id_user
      this.mascotaService.RegisterMascotaByuser(mascotawithIDuser).subscribe({
        next: () => {
          this.toast.showAfterRedirect('Mascota registrada correctamente 🐾');
          this.router.navigate(['/vet/users-list']);
        },
        error: (err) => console.error(err)
      });

    }
    else {
      this.mascotaService.RegisterMascota(mascotaData).subscribe({
        next: () => {
          this.toast.showAfterRedirect('Mascota registrada correctamente 🐾');
          this.router.navigate(['/pets']);
        },
        error: (err) => console.error(err)
      });
    }
  }

  getColors(){
    this.colorService.getColors().subscribe({
      next:(data)=>{
        console.log(data)
        this.colors = data;
        if (this.colors.length > 0){
          this.mascotaForm.get('id_color')?.enable();
        }else{
          this.mascotaForm.get('id_color')?.disable();
        }
      },
      error:(err)=>{
        console.log(err);
      }
    })
  }

}
