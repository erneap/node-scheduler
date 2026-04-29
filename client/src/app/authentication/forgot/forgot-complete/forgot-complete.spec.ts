import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ForgotComplete } from './forgot-complete';

describe('ForgotComplete', () => {
  let component: ForgotComplete;
  let fixture: ComponentFixture<ForgotComplete>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ForgotComplete],
    }).compileComponents();

    fixture = TestBed.createComponent(ForgotComplete);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
