import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServiceHome } from './service-home';

describe('ServiceHome', () => {
  let component: ServiceHome;
  let fixture: ComponentFixture<ServiceHome>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServiceHome]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ServiceHome);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
