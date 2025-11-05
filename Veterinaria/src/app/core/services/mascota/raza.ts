import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Raza } from '../../models/raza';

@Injectable({
  providedIn: 'root'
})
export class RazaService {

  private api=environment.apiurl
  constructor(private http:HttpClient){}

  public getRazas(especie?:string):Observable<Raza[]>{
    let params = new HttpParams();
     if (especie) {
      params = params.set('especie', especie);
    }
    return this.http.get<Raza[]>(`${this.api}razas/`, {params});
  }
}
