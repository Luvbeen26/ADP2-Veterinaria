import { inject, Injectable, signal } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { citas, ConsultaCreate, ConsultaResponse, ResumenResponse } from '../../models/consultas';
import { Auth } from '../auth/auth';
import { Getspecie, MascotaOut } from '../../models/mascota';

@Injectable({
  providedIn: 'root'
})
export class Consulta {
  private api=environment.apiurl
  
  tratamientosJson={
    "perro": {
      "medicamentos": [
        "Fenbendazol",
        "Praziquantel",
        "Pirantel",
        "Fipronil",
        "Selamectina",
        "Fluralaner",
        "Amoxicilina",
        "Cefalexina",
        "Enrofloxacina",
        "Carprofeno",
        "Meloxicam",
        "Firocoxib",
        "Doxiciclina",
        "Itraconazol",
        "Omeprazol",
        "Gabapentina"
      ],
      "vacunas": [
        "Rabia",
        "Parvovirus",
        "Moquillo",
        "Hepatitis infecciosa",
        "Leptospirosis",
        "Parainfluenza",
        "Bordetella",
        "Coronavirus canino"
      ]
    },
    "gato": {
      "medicamentos": [
        "Fenbendazol",
        "Praziquantel",
        "Pirantel",
        "Selamectina",
        "Fipronil",
        "Imidacloprid",
        "Amoxicilina-clavulánico",
        "Doxiciclina",
        "Enrofloxacina",
        "Meloxicam",
        "Robenacoxib",
        "Itraconazol",
        "Omeprazol",
        "Gabapentina"
      ],
      "vacunas":[
        "Rabia",
        "Panleucopenia felina",
        "Rinotraqueítis viral felina",
        "Calicivirus felino",
        "Leucemia felina",
        "Clamidiosis felina"
      ]
    }
  }
  
  constructor(private http:HttpClient){}
  

  public get_pendient_citas(status:string): Observable<citas[]>{
    return this.http.get<citas[]>(`${this.api}citas/show/citas`,{params:{status}});
  }

  public Mark_accept_cita(id_cita:number){
    return this.http.patch<any>(`${this.api}citas/mark/accept/${id_cita}`,{});
  }

  public Mark_refuse_cita(id_cita:number){
    return this.http.patch<any>(`${this.api}citas/mark/refused/${id_cita}`,{});
  }

  getConsultas():Observable<ConsultaResponse[]> {
    return this.http.get<ConsultaResponse[]>(`${this.api}consultas`);
  }
  getConsultasByMascotaId(id_consulta:number):Observable<ConsultaResponse[]> {
    return this.http.get<ConsultaResponse[]>(`${this.api}consultas/${id_consulta}`);
  }
  generarResumenIA(id_mascota:number):Observable<MascotaOut>{
    return this.http.patch<MascotaOut>(`${this.api}consultas/generarResumenClinico/${id_mascota}`, {});
  }

  createConsulta(data: ConsultaCreate) {
    return this.http.post<ConsultaResponse>(`${this.api}consultas/create`, data);
  }

  GetTratamientos(especie:"gato" | "perro"){
    return especie == "gato" ? this.tratamientosJson.gato : this.tratamientosJson.perro
  }

  GetSpecie(id:number):Observable <Getspecie>{
    return this.http.get<Getspecie>(`${this.api}pet/get/specie?id=${id}`)
  }

  
}
