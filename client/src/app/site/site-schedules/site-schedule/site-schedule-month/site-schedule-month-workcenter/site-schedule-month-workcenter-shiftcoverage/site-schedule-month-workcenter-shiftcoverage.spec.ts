import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SiteScheduleMonthWorkcenterShiftcoverage } from './site-schedule-month-workcenter-shiftcoverage';

describe('SiteScheduleMonthWorkcenterShiftcoverage', () => {
  let component: SiteScheduleMonthWorkcenterShiftcoverage;
  let fixture: ComponentFixture<SiteScheduleMonthWorkcenterShiftcoverage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteScheduleMonthWorkcenterShiftcoverage],
    }).compileComponents();

    fixture = TestBed.createComponent(SiteScheduleMonthWorkcenterShiftcoverage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
