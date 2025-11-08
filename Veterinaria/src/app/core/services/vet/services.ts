  import { Injectable } from '@angular/core';
import { ServiceModel } from '../../models/service';

  @Injectable({
    providedIn: 'root'
  })
  export class Services {

    public getServices():ServiceModel[]{
      return [
      {
        id: 'consulta',
        name: 'Consulta médica',
        description:
          'Consulta con un profesional en el ámbito veterinario, también se consideran vacunas y desparasitaciones.',
        image: '/consulta.png',
        route: '/pets/appointment',
        query: {service:'consulta'}
      },
      {
        id:'salon',
        name: 'Salon de cuidados',
        description:
          'Servicio completo de baño, corte de pelo, limpieza dental y de oídos para tu mascota.',
        image: '/salon.png',
        route: '/pets/appointment',
        query: {service:'salon'}
      },
      {
        id:'adoptar',
        name: 'Adopcion',
        description:
          'Adopcion de mascotas que no cuentan con hogar y les gustaria tener uno.',
        image: '/adopcion.png',
        route: '/pets/appointment',
        query: {service:'adoptar'}
      }
    ];
    }
  }
