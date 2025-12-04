import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegConsulta } from './reg-consulta';

describe('RegConsulta', () => {
  let component: RegConsulta;
  let fixture: ComponentFixture<RegConsulta>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegConsulta]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegConsulta);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
