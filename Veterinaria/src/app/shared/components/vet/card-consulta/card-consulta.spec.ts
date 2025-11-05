import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardConsulta } from './card-consulta';

describe('CardConsulta', () => {
  let component: CardConsulta;
  let fixture: ComponentFixture<CardConsulta>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardConsulta]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CardConsulta);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
