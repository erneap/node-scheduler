import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ForgotEmail } from './forgot-email';

describe('ForgotEmail', () => {
  let component: ForgotEmail;
  let fixture: ComponentFixture<ForgotEmail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ForgotEmail],
    }).compileComponents();

    fixture = TestBed.createComponent(ForgotEmail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
