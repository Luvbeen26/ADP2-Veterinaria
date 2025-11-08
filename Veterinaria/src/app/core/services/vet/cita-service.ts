import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { CitaCreate, HorasDisponiblesResponse } from '../../models/cita';
import { Observable } from 'rxjs';

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
}
