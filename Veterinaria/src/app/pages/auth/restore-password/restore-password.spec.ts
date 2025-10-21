import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RestorePassword } from './restore-password';

describe('RestorePassword', () => {
  let component: RestorePassword;
  let fixture: ComponentFixture<RestorePassword>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RestorePassword]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RestorePassword);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
