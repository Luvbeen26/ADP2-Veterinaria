import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { CitaCreate, CitaUpdate, HorasDisponiblesResponse } from '../../models/cita';
import { Observable } from 'rxjs';
import { citas } from '../../models/consultas';

@Injectable({
  providedIn: 'root'
})
export class CitaService {
  private api=environment.apiurl
  constructor(private http: HttpClient) {}

  createCita(cita: CitaCreate): Observable<CitaCreate> {
    const url = `${this.api}citas/create`;
    return this.http.post<CitaCreate>(url, cita);
  }
  obtenerHorasDisponibles(servicio: string, fecha: string): Observable<HorasDisponiblesResponse> {
    const url = `${this.api}citas/horas-disponibles/${servicio}?fecha=${fecha}`;
    return this.http.get<HorasDisponiblesResponse>(url);
  }
  getCitaById(id_cita:number) : Observable<citas>{
    return this.http.get<citas>(`${this.api}citas/${id_cita}`);
  }
  updateCita(id_cita:number, cita:CitaUpdate):Observable<citas>{
    return this.http.patch<citas>(`${this.api}citas/update/${id_cita}`, cita);
  }
  cancelarCita(id_cita:number):Observable<citas>{
    return this.http.patch<citas>(`${this.api}citas/cancelarCita/${id_cita}`,{});
  }
}
