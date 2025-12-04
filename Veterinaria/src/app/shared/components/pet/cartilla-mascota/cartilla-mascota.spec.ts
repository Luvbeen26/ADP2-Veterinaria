import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CartillaMascota } from './cartilla-mascota';

describe('CartillaMascota', () => {
  let component: CartillaMascota;
  let fixture: ComponentFixture<CartillaMascota>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CartillaMascota]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CartillaMascota);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
