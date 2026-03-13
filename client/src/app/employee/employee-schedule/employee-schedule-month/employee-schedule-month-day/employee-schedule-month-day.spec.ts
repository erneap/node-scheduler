import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeScheduleMonthDay } from './employee-schedule-month-day';

describe('EmployeeScheduleMonthDay', () => {
  let component: EmployeeScheduleMonthDay;
  let fixture: ComponentFixture<EmployeeScheduleMonthDay>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeScheduleMonthDay],
    }).compileComponents();

    fixture = TestBed.createComponent(EmployeeScheduleMonthDay);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
