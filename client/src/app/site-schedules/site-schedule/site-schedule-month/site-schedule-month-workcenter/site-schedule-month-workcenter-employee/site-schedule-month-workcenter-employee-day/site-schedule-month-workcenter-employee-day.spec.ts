import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SiteScheduleMonthWorkcenterEmployeeDay } from './site-schedule-month-workcenter-employee-day';

describe('SiteScheduleMonthWorkcenterEmployeeDay', () => {
  let component: SiteScheduleMonthWorkcenterEmployeeDay;
  let fixture: ComponentFixture<SiteScheduleMonthWorkcenterEmployeeDay>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteScheduleMonthWorkcenterEmployeeDay],
    }).compileComponents();

    fixture = TestBed.createComponent(SiteScheduleMonthWorkcenterEmployeeDay);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
