import { Component, Input } from '@angular/core';

import { cardService } from '../../../core/models/service';


@Component({
  selector: 'app-service-home',
  imports: [],
  templateUrl: './service-home.html',
  styleUrl: './service-home.css'
})
export class ServiceHome {
  @Input() cardService!:cardService;


  
  
  
}
