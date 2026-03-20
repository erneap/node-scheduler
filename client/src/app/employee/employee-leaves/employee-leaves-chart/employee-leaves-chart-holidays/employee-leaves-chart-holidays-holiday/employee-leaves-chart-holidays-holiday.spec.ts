import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeLeavesChartHolidaysHoliday } from './employee-leaves-chart-holidays-holiday';

describe('EmployeeLeavesChartHolidaysHoliday', () => {
  let component: EmployeeLeavesChartHolidaysHoliday;
  let fixture: ComponentFixture<EmployeeLeavesChartHolidaysHoliday>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeLeavesChartHolidaysHoliday],
    }).compileComponents();

    fixture = TestBed.createComponent(EmployeeLeavesChartHolidaysHoliday);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
