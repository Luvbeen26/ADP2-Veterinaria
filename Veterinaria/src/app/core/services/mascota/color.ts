import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';
import { ColorOut } from '../../models/color';

@Injectable({
  providedIn: 'root'
})
export class Color {
  private api=environment.apiurl
  constructor(private http:HttpClient){}

  public getColors():Observable<ColorOut[]>{
    return this.http.get<ColorOut[]>(`${this.api}color/colors`);
  }

}
