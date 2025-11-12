import { Component, Input } from '@angular/core';
import {MatIcon, MatIconModule} from '@angular/material/icon'
import { cardService } from '../../../core/models/service';


@Component({
  selector: 'app-service-home',
  imports: [MatIcon],
  templateUrl: './service-home.html',
  styleUrl: './service-home.css'
})
export class ServiceHome {
  @Input() cardService!:cardService;


  
  
  
}
