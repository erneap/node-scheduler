import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeLeavesChartHolidaysHolidayDisplay } from './employee-leaves-chart-holidays-holiday-display';

describe('EmployeeLeavesChartHolidaysHolidayDisplay', () => {
  let component: EmployeeLeavesChartHolidaysHolidayDisplay;
  let fixture: ComponentFixture<EmployeeLeavesChartHolidaysHolidayDisplay>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeLeavesChartHolidaysHolidayDisplay],
    }).compileComponents();

    fixture = TestBed.createComponent(EmployeeLeavesChartHolidaysHolidayDisplay);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
