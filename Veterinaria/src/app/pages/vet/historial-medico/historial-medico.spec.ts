import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HistorialMedico } from './historial-medico';

describe('HistorialMedico', () => {
  let component: HistorialMedico;
  let fixture: ComponentFixture<HistorialMedico>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistorialMedico]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HistorialMedico);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
