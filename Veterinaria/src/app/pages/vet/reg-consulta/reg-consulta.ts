import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray, AbstractControl, ValidationErrors } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Consulta } from '../../../core/services/vet/consulta';
import { ConsultaCreate, cuidadosWithSpecie } from '../../../core/models/consultas';
import { Auth } from '../../../core/services/auth/auth';
import { ToastService } from '../../../core/services/extra/toast-service';


@Component({
  selector: 'app-reg-consulta',
  imports: [CommonModule,ReactiveFormsModule],
  templateUrl: './reg-consulta.html',
  styleUrl: './reg-consulta.css'
})
export class RegConsulta {
  recordForm!: FormGroup;
  id_cita!: number;
  petId!:number;
  
  consultService=inject(Consulta);
  authService=inject(Auth);
  router=inject(Router)
  toast=inject(ToastService)

  vetName=signal<string>("");
  petName=signal<string>("");
  vacunas = signal<string[]>([]);
  medicamentos= signal<string[]>([]);
  desparasitantes =signal<string[]>([]);
  cuidadosLst=signal<cuidadosWithSpecie[]>([]);
  cuidadosList = [
      { "id": 24, "descripcion": "Aislar en caso de enfermedad para evitar contagios", "especie": "PG" },
      { "id": 4,  "descripcion": "Alimento con proteina", "especie": "PG" },
      { "id": 1,  "descripcion": "Aplicar nebulizaciones", "especie": "PG" },
      { "id": 18, "descripcion": "Aplicar compresas tibias", "especie": "PG" },
      { "id": 19, "descripcion": "Aplicar compresas frías", "especie": "PG" },
      { "id": 8,  "descripcion": "Aumentar Raciones", "especie": "PG" },
      { "id": 23, "descripcion": "Bañar con shampoo adecuado", "especie": "PG" },
      { "id": 2,  "descripcion": "Colocar arena adecuada", "especie": "G" },
      { "id": 7,  "descripcion": "Controlar Raciones", "especie": "PG" },
      { "id": 6,  "descripcion": "Dar alimentos suaves", "especie": "PG" },
      { "id": 9,  "descripcion": "Desparasitar", "especie": "PG" },
      { "id": 21, "descripcion": "Dividir la comida en porciones pequeñas", "especie": "PG" },
      { "id": 13, "descripcion": "Estimular con juguetes", "especie": "G" },
      { "id": 15, "descripcion": "Evitar actividad física intensa", "especie": "P" },
      { "id": 5,  "descripcion": "Evitar alimentos grasosos", "especie": "PG" },
      { "id": 17, "descripcion": "Evitar cambios bruscos de temperatura", "especie": "PG" },
      { "id": 10, "descripcion": "Hidratar mas", "especie": "PG" },
      { "id": 26, "descripcion": "Humedecer el alimento para facilitar la ingesta", "especie": "PG" },
      { "id": 25, "descripcion": "Introducir nuevos alimentos de forma gradual", "especie": "PG" },
      { "id": 3,  "descripcion": "Limpiar entorno", "especie": "PG" },
      { "id": 16, "descripcion": "Mantener en reposo", "especie": "PG" },
      { "id": 22, "descripcion": "Ofrecer caldos sin sal como hidratación suave", "especie": "PG" },
      { "id": 11, "descripcion": "Ofrecer sueros orales", "especie": "PG" },
      { "id": 14, "descripcion": "Realizar actividad fisica", "especie": "PG" },
      { "id": 12, "descripcion": "Revisar signos de deshidratacion", "especie": "PG" },
      { "id": 20, "descripcion": "Supervisar heridas o zonas irritadas", "especie": "PG" }
  ];


  constructor(private fb: FormBuilder,private route: ActivatedRoute) {}

  ngOnInit(): void {
    
    this.id_cita = Number(this.route.snapshot.paramMap.get('id') || '0');

    this.recordForm = this.fb.group({
      fecha: [this.getTodayDate(), Validators.required],
      motivo: ['', [Validators.required, Validators.maxLength(500)]],
      diagnostico: ['', [Validators.required, Validators.maxLength(255)]],
      observaciones: ['', Validators.maxLength(1000)],
//      peso_actual: ['', [Validators.min(0.1), Validators.max(200)]],
      
      tratamientos: this.fb.array([]),
      cuidados: this.fb.array([],this.minSelectedCheckboxes(1))
    });

    this.consultService.GetCita(Number(this.id_cita)).subscribe({
      next: (res) => {
        const especieMascota: "gato" | "perro" =
          res.especie === "G" ? "gato" : "perro";

        const data = this.consultService.GetTratamientos(especieMascota);

        this.vacunas.set(data.vacunas);
        this.medicamentos.set(data.medicamentos);
        this.petId=res.id_mascota;
        this.petName.set(res.pet_name)
        this.vetName.set("Dr "+res.vet_name)
        const cuidadosFiltrados = this.cuidadosList.filter(c =>
          c.especie === res.especie || c.especie === "PG"
        );

        this.cuidadosLst.set(cuidadosFiltrados);
      },
      error: (error) => {
        this.toast.showAfterRedirect('No hay una Cita en la que registrar una consulta');
        this.router.navigate(['/vet']);
      }
    });

    const vetData=this.authService.getCurrentUser()

  }

  private getTodayDate(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  get tratamientos(): FormArray {
    return this.recordForm.get('tratamientos') as FormArray;
  }

  get cuidados(): FormArray {
    return this.recordForm.get('cuidados') as FormArray;
  }

  agregarTratamiento(tipo: 'vacuna' | 'medicamento' | 'desparasitante'): void {
    const tratamientoGroup = this.fb.group({
      tipo: [tipo, Validators.required],
      descripcion: ['', [Validators.required, Validators.maxLength(255)]]
    });

    this.tratamientos.push(tratamientoGroup);
  }

  eliminarTratamiento(index: number): void {
    this.tratamientos.removeAt(index);
  }

  toggleCuidado(cuidadoId: number): void {
    const index = this.cuidados.controls.findIndex(
      control => control.value.id_cuidado === cuidadoId
    );

    if (index >= 0) {
      this.cuidados.removeAt(index);
    } else {
      const cuidadoGroup = this.fb.group({
        id_cuidado: [cuidadoId, Validators.required],
        
      });
      this.cuidados.push(cuidadoGroup);
    }
  }


  toggleTratamiento(tipo: 'vacuna' | 'medicamento' | 'desparasitante', descripcion: string): void {
    const index = this.tratamientos.controls.findIndex(
      control => control.value.tipo === tipo && control.value.descripcion === descripcion
    );

    if (index >= 0) {
      this.tratamientos.removeAt(index);
    } else {
      const tratamientoGroup = this.fb.group({
        tipo: [tipo, Validators.required],
        descripcion: [descripcion, [Validators.required, Validators.maxLength(255)]]
      });
      this.tratamientos.push(tratamientoGroup);
    }
    const listaTratamientos = this.tratamientos.value;
    console.log(listaTratamientos);
  }

  isTratamientoSelected(tipo: 'vacuna' | 'medicamento' | 'desparasitante', descripcion: string): boolean {
    return this.tratamientos.controls.some(
      control => control.value.tipo === tipo && control.value.descripcion === descripcion
    );
  }

  isCuidadoSelected(cuidadoId: number): boolean {
    return this.cuidados.controls.some(
      control => control.value.id_cuidado === cuidadoId
    );
  }

  onSubmit(): void {
    if (this.recordForm.invalid) {
      this.recordForm.markAllAsTouched();
      return;
    }
    

    const consulta: ConsultaCreate = {
      id_cita: this.id_cita,
      motivo:this.recordForm.get('motivo')?.value,
      diagnostico:this.recordForm.get('diagnostico')?.value,
      observaciones:this.recordForm.get('observaciones')?.value,
      tratamientos: this.tratamientos.length >0 ? this.tratamientos.value : null,
      cuidados: this.cuidados.length >0 ? this.cuidados.value: null
    };
    
    this.consultService.createConsulta(consulta).subscribe({
      next:res=>{
        this.toast.showAfterRedirect('Consulta Registrada correctamente');
        this.router.navigate(['/vet']);
      },
      error:err=>{
        console.log(err)
      }
    });

  
  }

  minSelectedCheckboxes(min: number) {
  return (control: AbstractControl): ValidationErrors | null => {
    const formArray = control as FormArray;
    const totalSelected = formArray.controls.length;
    return totalSelected >= min ? null : { minSelected: { required: min, actual: totalSelected } };
  };
  }

  
}
