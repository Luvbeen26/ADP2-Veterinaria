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
        image: 'https://i.pinimg.com/736x/85/31/c8/8531c89575222bd2085c9f7dfb33f437.jpg',
        route: '/pets/appointment',
        query: {service:'consulta'}
      },
      {
        id:'salon',
        name: 'Salon de cuidados',
        description:
          'Servicio completo de baño, corte de pelo, limpieza dental y de oídos para tu mascota.',
        image: 'https://i.pinimg.com/736x/85/31/c8/8531c89575222bd2085c9f7dfb33f437.jpg',
        route: '/pets/appointment',
        query: {service:'salon'}
      },
      {
        id:'adoptar',
        name: 'Adopcion',
        description:
          'Servicio completo de adopcion',
        image: 'https://i.pinimg.com/736x/85/31/c8/8531c89575222bd2085c9f7dfb33f437.jpg',
        route: '/pets/appointment',
        query: {service:'adoptar'}
      }
    ];
    }
  }
