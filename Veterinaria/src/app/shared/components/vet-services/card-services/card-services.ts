import { Component, Input } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { ServiceModel } from '../../../../core/models/service';
import { MatIcon } from "@angular/material/icon";

@Component({
  selector: 'app-card-services',
  imports: [RouterModule, MatIcon],
  templateUrl: './card-services.html',
  styleUrl: './card-services.css'
})
export class CardServices {

  constructor(public router:Router){}

    @Input() service!: ServiceModel;
}
