import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../../models/users';
import { MascotasGetByUser } from '../../models/mascota';

@Injectable({
  providedIn: 'root'
})
export class Users {
  private api=environment.apiurl
  constructor(private http:HttpClient){}

  public GetUsers(name:string): Observable<User[]>{
    let params = new HttpParams();

    if (name) {
      params = params.set("name", name);
    }
    return this.http.get<User[]>(`${this.api}users/get/All_users`,{params})
  }

  public GetPetsByUser(id:number): Observable<MascotasGetByUser[]>{
    let params=new HttpParams();
    params=params.set("id",id)
    return this.http.get<MascotasGetByUser[]>(`${this.api}users/get/petsById`,{params})
  }
}
