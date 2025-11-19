import { Component, Input, Output } from '@angular/core';
import { MascotaOut} from '../../../../core/models/mascota';
import { MatIconModule } from '@angular/material/icon';
import { Mascota } from '../../../../core/services/mascota/mascota';
import { EventEmitter } from '@angular/core';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { MatDialog } from '@angular/material/dialog';
import { routes } from '../../../../app.routes';
import { Router } from '@angular/router';

@Component({
  selector: 'app-card-my-pet',
  imports: [MatIconModule],
  templateUrl: './card-my-pet.html',
  styleUrl: './card-my-pet.css'
})
export class CardMyPet {

  @Input() mascota?:MascotaOut;
   @Output() mascotaEliminada: EventEmitter<number> = new EventEmitter<number>();
  constructor(private mascotaService:Mascota, private dialog:MatDialog, private router:Router){}

  public editarMascota(id_mascota:number){
    this.router.navigate([`pets/edit-pet/${id_mascota}`]);
  }
  public verDetalles(){

  }

  public eliminarMascota() {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '320px',
      data: {
        title: 'Confirmar eliminación',
        message: `¿Estás seguro de eliminar a ${this.mascota?.nombre}?`
      },
      enterAnimationDuration: '200ms',
      exitAnimationDuration: '200ms'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && this.mascota?.id_mascota) {
        this.mascotaService.deleteMascota(this.mascota.id_mascota).subscribe({
          next: () => {
            console.log('Mascota eliminada');
            this.mascotaEliminada.emit(this.mascota!.id_mascota);
          },
          error: err => console.error('Error al eliminar:', err)
        });
      }
    });
  }

  calcularEdad(fechaNacimiento: string): number {
    if (!fechaNacimiento) return 0;

    const nacimiento = new Date(fechaNacimiento);
    const hoy = new Date();

    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();

    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }

    return edad;
  }


}
