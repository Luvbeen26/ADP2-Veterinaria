import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { citas } from '../../models/consultas';
import { Auth } from '../auth/auth';

@Injectable({
  providedIn: 'root'
})
export class Consulta {
  private api=environment.apiurl
  private auth=inject(Auth)
  constructor(private http:HttpClient){}

  public get_pendient_citas(): Observable<citas[]>{
    //const token=this.auth.getToken();//const headers=new HttpHeaders({// 'Authorization': `Bearer ${token}`//})
    return this.http.get<citas[]>(`${this.api}citas/pendient/cita`/*,{headers}*/);
  }

  public Mark_accept_cita(id_cita:number){
    return this.http.patch<any>(`${this.api}citas/mark/accept/${id_cita}`,{});
  }

  public Mark_refuse_cita(id_cita:number){
    return this.http.patch<any>(`${this.api}citas/mark/refused/${id_cita}`,{});
  }
}
