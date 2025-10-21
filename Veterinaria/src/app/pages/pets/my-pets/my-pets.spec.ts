import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyPets } from './my-pets';

describe('MyPets', () => {
  let component: MyPets;
  let fixture: ComponentFixture<MyPets>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyPets]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MyPets);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
