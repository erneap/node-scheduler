import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ForgotQuestion } from './forgot-question';

describe('ForgotQuestion', () => {
  let component: ForgotQuestion;
  let fixture: ComponentFixture<ForgotQuestion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ForgotQuestion],
    }).compileComponents();

    fixture = TestBed.createComponent(ForgotQuestion);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
