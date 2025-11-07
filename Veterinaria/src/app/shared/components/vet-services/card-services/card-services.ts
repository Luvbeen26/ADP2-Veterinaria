import { Component, Input } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { ServiceModel } from '../../../../core/models/service';

@Component({
  selector: 'app-card-services',
  imports: [RouterModule],
  templateUrl: './card-services.html',
  styleUrl: './card-services.css'
})
export class CardServices {

  constructor(public router:Router){}

    @Input() service!: ServiceModel;
}
