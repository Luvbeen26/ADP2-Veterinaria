import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VetServices } from './vet-services';

describe('VetServices', () => {
  let component: VetServices;
  let fixture: ComponentFixture<VetServices>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VetServices]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VetServices);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
