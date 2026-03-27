import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SiteScheduleMonthWorkcenterEmployee } from './site-schedule-month-workcenter-employee';

describe('SiteScheduleMonthWorkcenterEmployee', () => {
  let component: SiteScheduleMonthWorkcenterEmployee;
  let fixture: ComponentFixture<SiteScheduleMonthWorkcenterEmployee>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteScheduleMonthWorkcenterEmployee],
    }).compileComponents();

    fixture = TestBed.createComponent(SiteScheduleMonthWorkcenterEmployee);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
