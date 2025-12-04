import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Consulta } from '../../../core/services/vet/consulta';
import { ConsultaCreate, cuidadosWithSpecie } from '../../../core/models/consultas';


@Component({
  selector: 'app-reg-consulta',
  imports: [CommonModule,ReactiveFormsModule],
  templateUrl: './reg-consulta.html',
  styleUrl: './reg-consulta.css'
})
export class RegConsulta {
  recordForm!: FormGroup;
  petId: string = '';
  petName: string = '';
  consultService=inject(Consulta)
  
  vacunas = signal<string[]>([]);

  medicamentos= signal<string[]>([]);
  desparasitantes =signal<string[]>([]);
  cuidadosLst=signal<cuidadosWithSpecie[]>([]);
  /*
  Observaciones (que funcione como notas) // que aparezca en modal?

  Agregar un diagnostico 

  Añadir peso de la mascota  


  Poder añadir una de recetas

  */
  
  
  cuidadosList = [
    { "id": 1,  "descripcion": "Aplicar nebulizaciones","especie": "PG" },
    { "id": 2,  "descripcion": "Colocar arena adecuada","especie": "G"  },
    { "id": 3,  "descripcion": "Limpiar entorno","especie": "PG" },
    { "id": 4,  "descripcion": "Alimento con proteina","especie": "PG" },
    { "id": 5,  "descripcion": "Evitar alimentos grasosos","especie": "PG" },
    { "id": 6,  "descripcion": "Dar alimentos suaves","especie": "PG" },
    { "id": 7,  "descripcion": "Controlar Raciones","especie": "PG" },
    { "id": 8,  "descripcion": "Aumentar Raciones","especie": "PG" },
    { "id": 9,  "descripcion": "Desparasitar","especie": "PG" },
    { "id": 10, "descripcion": "Hidratar mas","especie": "PG" },
    { "id": 11, "descripcion": "Ofrecer sueros orales","especie": "PG" },
    { "id": 12, "descripcion": "Revisar signos de deshidratacion","especie": "PG" },
    { "id": 13, "descripcion": "Estimular con juguetes","especie": "G"  },
    { "id": 14, "descripcion": "Realizar actividad fisica","especie": "PG" }
  ];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    
    this.petId = this.route.snapshot.paramMap.get('id') || '0';

    this.recordForm = this.fb.group({
      id_mascota: [this.petId, Validators.required],
      fecha: [this.getTodayDate(), Validators.required],
      motivo: ['', [Validators.required, Validators.maxLength(500)]],
      diagnostico: ['', [Validators.required, Validators.maxLength(255)]],
      observaciones: ['', Validators.maxLength(1000)],
//      peso_actual: ['', [Validators.min(0.1), Validators.max(200)]],
      
      // Arrays para tratamientos
      tratamientos: this.fb.array([]),
      
      // Array para cuidados seleccionados
      cuidados: this.fb.array([])
    });

    this.consultService.GetSpecie(Number(this.petId)).subscribe({
      next: (res) => {
        const especieMascota: "gato" | "perro" =
          res.especie === "G" ? "gato" : "perro";

        const data = this.consultService.GetTratamientos(especieMascota);

        this.vacunas.set(data.vacunas);
        this.medicamentos.set(data.medicamentos);
        
        
        const cuidadosFiltrados = this.cuidadosList.filter(c =>
          c.especie === especieMascota || c.especie === "PG"
        );

        
        this.cuidadosLst.set(cuidadosFiltrados);
      },
      error: (error) => {
        console.log(error);
      }
    });
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
        observaciones: ['']
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
    const diagnostico=this.recordForm.get('diagnostico')?.value
    const observaciones=this.recordForm.get('observaciones')?.value
    const motivo=this.recordForm.get('motivo')?.value
    const tratamientos=this.tratamientos.value;
    const cuidados=this.cuidados.value;
    const consulta:ConsultaCreate={motivo,diagnostico,observaciones,tratamientos,cuidados}
    
    this.consultService.createConsulta(consulta).subscribe({

    });

  
  }

  
}


/*
DROP TABLE IF EXISTS `tratamientos`;

CREATE TABLE `tratamientos` (
  `id_tratamiento` INT NOT NULL AUTO_INCREMENT,
  `id_consulta` INT NOT NULL,
  `tipo` ENUM('vacuna', 'medicamento', 'desparasitante') NOT NULL,
  `descripcion` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`id_tratamiento`),
  KEY `id_consulta` (`id_consulta`),
  CONSTRAINT `tratamientos_ibfk_1` FOREIGN KEY (`id_consulta`) REFERENCES `consultas` (`id_consulta`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;



CREATE TABLE `cuidados_catalogo` (
  `id_cuidado` INT NOT NULL AUTO_INCREMENT,
  `descripcion` VARCHAR(200) NOT NULL,
  PRIMARY KEY (`id_cuidado`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Insertar los cuidados iniciales
INSERT INTO `cuidados_catalogo` (`descripcion`) VALUES
('Aplicar nebulizaciones'),
('Colocar arena adecuada'),
('Limpiar entorno'),
('Alimento con proteína'),
('Evitar alimentos grasosos'),
('Dar alimentos suaves'),
('Controlar raciones'),
('Aumentar raciones'),
('Desparasitar'),
('Hidratar más'),
('Ofrecer sueros orales'),
('Revisar signos de deshidratación'),
('Estimular con juguetes'),
('Realizar actividad física');


DROP TABLE IF EXISTS `consulta_cuidados`;

CREATE TABLE `consulta_cuidados` (
  `id_consulta_cuidado` INT NOT NULL AUTO_INCREMENT,
  `id_consulta` INT NOT NULL,
  `id_cuidado` INT NOT NULL,
  `observaciones` TEXT,
  PRIMARY KEY (`id_consulta_cuidado`),
  KEY `id_consulta` (`id_consulta`),
  KEY `id_cuidado` (`id_cuidado`),
  CONSTRAINT `consulta_cuidados_ibfk_1` FOREIGN KEY (`id_consulta`) REFERENCES `consultas` (`id_consulta`),
  CONSTRAINT `consulta_cuidados_ibfk_2` FOREIGN KEY (`id_cuidado`) REFERENCES `cuidados_catalogo` (`id_cuidado`)
);

*/
