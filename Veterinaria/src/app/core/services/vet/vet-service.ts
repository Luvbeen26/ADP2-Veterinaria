import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { Auth } from '../auth/auth';
import { Observable } from 'rxjs';
import { VeterinarioBase } from '../../models/veterinario';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class VetService {
  private api=environment.apiurl
  constructor(private http:HttpClient){}

  public getVeterinarios():Observable<VeterinarioBase[]>{
    return this.http.get<VeterinarioBase[]>(`${this.api}veterinario/veterinarios`);
  }
  
}
