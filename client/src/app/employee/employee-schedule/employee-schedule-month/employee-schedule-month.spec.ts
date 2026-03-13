import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeScheduleMonth } from './employee-schedule-month';

describe('EmployeeScheduleMonth', () => {
  let component: EmployeeScheduleMonth;
  let fixture: ComponentFixture<EmployeeScheduleMonth>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeScheduleMonth],
    }).compileComponents();

    fixture = TestBed.createComponent(EmployeeScheduleMonth);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
