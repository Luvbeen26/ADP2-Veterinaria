import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MascotaCreate, MascotaDeleteResponse, MascotaOut, MascotaUpdate} from '../../models/mascota';
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

  public deleteMascota(petId: number): Observable<MascotaDeleteResponse[]> {
    return this.http.delete<MascotaDeleteResponse[]>(`${this.api}pet/delete/${petId}`);
  }

  getMascotaById(petId: number): Observable<MascotaOut> {
    return this.http.get<MascotaOut>(`${this.api}pet/pets/${petId}`);
  }

  updateMascota(petId: number, petData: MascotaUpdate): Observable<MascotaUpdate> {
    return this.http.put<MascotaUpdate>(`${this.api}pet/update/${petId}`, petData);
  }


  
}
