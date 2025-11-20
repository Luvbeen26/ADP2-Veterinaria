import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Usercard } from './usercard';

describe('Usercard', () => {
  let component: Usercard;
  let fixture: ComponentFixture<Usercard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Usercard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Usercard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
