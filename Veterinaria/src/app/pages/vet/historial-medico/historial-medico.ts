import { Component, inject, signal } from '@angular/core';
import { MatIconModule } from "@angular/material/icon";
import { Consulta } from '../../../core/services/vet/consulta';
import { ConsultaResponse, ResumenResponse, tratamiento } from '../../../core/models/consultas';
import { ActivatedRoute } from '@angular/router';
import { Mascota } from '../../../core/services/mascota/mascota';
import { Auth } from '../../../core/services/auth/auth';
import { MascotaOut } from '../../../core/models/mascota';

@Component({
  selector: 'app-historial-medico',
  imports: [MatIconModule],
  templateUrl: './historial-medico.html',
  styleUrl: './historial-medico.css'
})
export class HistorialMedico {
  consultaService=inject(Consulta)
  route=inject(ActivatedRoute)
  consultas = signal<ConsultaResponse[]>([]);
  mascotaService = inject(Mascota)
  authService=inject(Auth)
  loading:boolean=false;
  idmascota:number=0;
  mascota = signal<MascotaOut>({} as MascotaOut);

  

  ngOnInit():void{
    this.authService.currentUser$.subscribe(user=>{
      if (user){
        this.idmascota = Number(this.route.snapshot.paramMap.get('id'));
        this.getConsultasByMascotaId(this.idmascota);
        this.getMAscotaById(this.idmascota);
      }
    })

  }

  getConsultasByMascotaId(id_consulta:number){
    this.consultaService.getConsultasByMascotaId(id_consulta).subscribe({
      next:(data)=>{
        this.consultas.set(data);
        console.log(data)
      },
      error:(err)=>{
        console.log(err);
      }
    })
  }

  generarResumenIA(id_mascota:number){
    this.loading = true;
    this.consultaService.generarResumenIA(id_mascota).subscribe({
      next:(data)=>{
        console.log(data);
        this.loading=false;
        this.mascota.set(data);
      },
      error:(err)=>{
        
        this.loading=false;
        console.log(err)
      }
    })
  }

  getTiposUnicos(tratamientos: tratamiento[] | null | undefined): string[] {
    if (!tratamientos || tratamientos.length === 0) return [];
    
    const tipos = new Set(tratamientos.map(t => t.tipo));
    return Array.from(tipos);
  }

  getMAscotaById(id_mascota:number){
    this.mascotaService.getMascotaById(id_mascota).subscribe({
      next:(data)=>{
        this.mascota.set(data);
      },
      error:(err)=>{
        console.log(err)
      }
    })
  }
}
