import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MascotaCreate, MascotaOut} from '../../models/mascota';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class Mascota {
  private api=environment.apiurl
  constructor(private http:HttpClient){}

  public RegisterMascota(mascotaData: MascotaCreate):Observable<MascotaCreate[]>{
    return this.http.post<MascotaCreate[]>(`${this.api}pet/create`, mascotaData);
  }

  public getMascotas(): Observable<MascotaOut[]>{
    return this.http.get<MascotaOut[]>(`${this.api}pet/petsByUserLogged`);
  }


  
}
