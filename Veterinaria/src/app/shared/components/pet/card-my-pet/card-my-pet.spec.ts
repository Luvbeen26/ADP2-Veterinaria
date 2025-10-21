import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardMyPet } from './card-my-pet';

describe('CardMyPet', () => {
  let component: CardMyPet;
  let fixture: ComponentFixture<CardMyPet>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardMyPet]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CardMyPet);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
