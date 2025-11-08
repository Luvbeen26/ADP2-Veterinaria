import { Component, signal} from '@angular/core';
import { CardMyPet } from "../../../shared/components/pet/card-my-pet/card-my-pet";
import { MascotaOut } from '../../../core/models/mascota';
import { Mascota } from '../../../core/services/mascota/mascota';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { Auth } from '../../../core/services/auth/auth';

@Component({
  selector: 'app-my-pets',
  imports: [CardMyPet, MatIconModule],
  templateUrl: './my-pets.html',
  styleUrl: './my-pets.css'
})
export class MyPets {
  mascotas = signal<MascotaOut[]>([]);
  
  constructor(private mascotasService: Mascota, private router:Router, private authService:Auth) {
  }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.getMascotas();
      }
    });
  }

  getMascotas() {
    this.mascotasService.getMascotas().subscribe({
      next: (data) =>{ this.mascotas.set(data);
        console.log(data);
      },
      error: (err) => console.log(err)
    });
  }

  public navigateRegisterPet(){
    this.router.navigate(['pets/register-pet']);
  }

  onMascotaEliminada(id_mascota: number) {
    this.mascotas.update(mascotas => mascotas.filter(m => m.id_mascota !== id_mascota));
  }


}
