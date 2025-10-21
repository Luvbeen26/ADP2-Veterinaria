import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegisterPet } from './register-pet';

describe('RegisterPet', () => {
  let component: RegisterPet;
  let fixture: ComponentFixture<RegisterPet>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterPet]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegisterPet);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
