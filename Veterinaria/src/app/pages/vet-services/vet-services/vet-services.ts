import { Component } from '@angular/core';
import { CardServices } from "../../../shared/components/vet-services/card-services/card-services";
import { Services } from '../../../core/services/vet/services';
import { ServiceModel } from '../../../core/models/service';

@Component({
  selector: 'app-vet-services',
  imports: [CardServices],
  templateUrl: './vet-services.html',
  styleUrl: './vet-services.css'
})
export class VetServices {
  services:ServiceModel[] = [];
  constructor(private servicesService:Services){}

  ngOnInit(){
    this.services = this.servicesService.getServices();
  }
}
