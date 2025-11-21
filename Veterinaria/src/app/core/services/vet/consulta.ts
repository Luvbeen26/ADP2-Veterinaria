import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { citas, ConsultaCreate, ConsultaResponse, ResumenResponse } from '../../models/consultas';
import { Auth } from '../auth/auth';
import { MascotaOut } from '../../models/mascota';

@Injectable({
  providedIn: 'root'
})
export class Consulta {
  private api=environment.apiurl
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
  return this.http.post<ConsultaResponse>(`${this.api}consultas`, data);
}

}
