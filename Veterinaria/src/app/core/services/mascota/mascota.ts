import { HttpClient } from '@angular/common/http';
import { inject, Injectable, Injector } from '@angular/core';
import { CartillaMascotaOut, MascotaCreate, MascotaCreatewithID, MascotaDeleteResponse, MascotaOut, MascotaUpdate} from '../../models/mascota';
import { Observable } from 'rxjs';
import { Reauthentication } from '../../security/reauthentication';
import { ZERO_TRUST_ENABLED } from '../../security/contracts';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class Mascota {
  private readonly secure = inject(ZERO_TRUST_ENABLED);
  private readonly injector = inject(Injector);
  private api=environment.apiurl
  constructor(private http:HttpClient){}

  public RegisterMascota(mascotaData: MascotaCreate):Observable<MascotaCreate[]>{
    return this.http.post<MascotaCreate[]>(`${this.api}pet/create`, mascotaData);
  }

  public getMascotas(): Observable<MascotaOut[]>{
    return this.http.get<MascotaOut[]>(`${this.api}pet/petsByUserLogged`);
  }

  public deleteMascota(petId: number): Observable<MascotaDeleteResponse[] | void> {
    if (this.secure) return this.injector.get(Reauthentication).run('pet:delete', String(petId), proof => this.http.delete<void>(`${this.api}pet/delete/${petId}`, {headers: {'X-Reauth-Token': proof}}));
    return this.http.delete<MascotaDeleteResponse[]>(`${this.api}pet/delete/${petId}`);
  }

  getMascotaById(petId: number): Observable<MascotaOut> {
    return this.http.get<MascotaOut>(`${this.api}pet/pets/${petId}`);
  }

  updateMascota(petId: number, petData: MascotaUpdate): Observable<MascotaUpdate> {
    return this.http.put<MascotaUpdate>(`${this.api}pet/update/${petId}`, petData);
  }

  getCartillaMascota(id_mascota:number):Observable<CartillaMascotaOut>{
    return this.http.get<CartillaMascotaOut>(`${this.api}pet/cartilla/${id_mascota}`);
  }

  public RegisterMascotaByuser(mascotaData: MascotaCreatewithID): Observable<MascotaCreatewithID[]> {
    return this.http.post<MascotaCreatewithID[]>(`${this.api}pet/create_byuser`, mascotaData);
  }


  
}
