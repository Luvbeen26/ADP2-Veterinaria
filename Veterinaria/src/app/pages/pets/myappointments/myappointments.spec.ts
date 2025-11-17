import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Myappointments } from './myappointments';

describe('Myappointments', () => {
  let component: Myappointments;
  let fixture: ComponentFixture<Myappointments>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Myappointments]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Myappointments);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
