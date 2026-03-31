import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SiteScheduleMonthWorkcenterShiftcoverageDay } from './site-schedule-month-workcenter-shiftcoverage-day';

describe('SiteScheduleMonthWorkcenterShiftcoverageDay', () => {
  let component: SiteScheduleMonthWorkcenterShiftcoverageDay;
  let fixture: ComponentFixture<SiteScheduleMonthWorkcenterShiftcoverageDay>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteScheduleMonthWorkcenterShiftcoverageDay],
    }).compileComponents();

    fixture = TestBed.createComponent(SiteScheduleMonthWorkcenterShiftcoverageDay);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
