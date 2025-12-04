import { Component, Inject, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Consulta } from '../../../core/services/vet/consulta';

interface Vaccine {
  name: string;
  value: string;
}

@Component({
  selector: 'app-reg-consulta',
  imports: [CommonModule,ReactiveFormsModule],
  templateUrl: './reg-consulta.html',
  styleUrl: './reg-consulta.css'
})
export class RegConsulta {
  recordForm!: FormGroup;
  petName: string = '';
  consultService=Inject(Consulta)
  
  vacunas:string[]=[]
  medicamentos:string[]=[]

  /*
  Observaciones (que funcione como notas) // que aparezca en modal?

  Agregar un diagnostico 

  Añadir peso de la mascota  


  Poder añadir una de recetas

  */
  
  
  cuidadosList = [
    { id: '1', name: 'Aplicar nebulizaciones' },
    { id: '2', name: 'Colocar arena adecuada' },
    { id: '3', name: 'Limpiar entorno' },
    { id: '4', name: 'Alimento con proteina' },
    { id: '5', name: 'Evitar alimentos grasosos' },
    { id: '6', name: 'Dar alimentos suaves' },
    { id: '7', name: 'Controlar Raciones' },
    { id: '8', name: 'Aumentar Raciones' },
    { id: '9', name: 'Desparasitar' },
    { id: '10', name: 'Hidratar mas' },
    { id: '11', name: 'Ofrecer sueros orales' },
    { id: '12', name: 'Revisar signos de deshidratacion' },
    { id: '13', name: 'Estimular con juguetes' },
    { id: '14', name: 'Realizar actividad fisica' }
  ];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.petName = this.route.snapshot.paramMap.get('petName') || 'la Mascota';

    this.recordForm = this.fb.group({
      veterinarian: ['', [Validators.required, Validators.minLength(3)]],
      fecha: [this.getTodayDate(), Validators.required],
      observations: ['', [Validators.maxLength(500)]],
      
      
      treatments: this.fb.group({
        desparasitante: [false],
        // Puedes agregar más tratamientos aquí
      }),
      
      obligatoryVaccines: this.fb.group({
        rinotraqueitis: [false],
        leucemia: [false],
        calicivirus: [false],
        rabia: [false],
        panleucopenia: [false],
        esterilizacion: [false]
      }),
      
      // Checkbox para activar el textarea de vacunas no obligatorias
      hasNonObligatoryVaccines: [false],
      nonObligatoryVaccines: [''],
      
      // Checkbox para activar el textarea de medicamentos
      hasMedicines: [false],
      medicines: ['']
    });

    
    this.recordForm.get('hasNonObligatoryVaccines')?.valueChanges.subscribe(checked => {
      const control = this.recordForm.get('nonObligatoryVaccines');
      if (checked) {
        control?.setValidators([Validators.required]);
      } else {
        control?.clearValidators();
        control?.setValue(''); // Limpia el valor cuando se desmarca
      }
      control?.updateValueAndValidity();
    });

    
    this.recordForm.get('hasMedicines')?.valueChanges.subscribe(checked => {
      const control = this.recordForm.get('medicines');
      if (checked) {
        control?.setValidators([Validators.required]);
      } else {
        control?.clearValidators();
        control?.setValue(''); // Limpia el valor cuando se desmarca
      }
      control?.updateValueAndValidity();
    });

    const data=this.
    this.vacunas=


  }

  private getTodayDate(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  onSubmit(): void {
    if (this.recordForm.invalid) {
      this.recordForm.markAllAsTouched();
      return;
    }

    const formData = this.recordForm.value;
    console.log('Datos del formulario:', formData);

    // Aquí harías la llamada al servicio
    // this.veterinaryService.createRecord(formData).subscribe({
    //   next: () => {
    //     this.router.navigate(['/records']);
    //   },
    //   error: (err) => console.error(err)
    // });
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