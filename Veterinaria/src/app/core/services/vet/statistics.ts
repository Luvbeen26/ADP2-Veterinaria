import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DashboardResponse } from '../../models/statistics';

@Injectable({
  providedIn: 'root'
})
export class Statistics {
  private api=environment.apiurl
  constructor(private http:HttpClient){}

  getStatistics():Observable<DashboardResponse>{
    return this.http.get<DashboardResponse>(`${this.api}statistics/`);
  }
}
