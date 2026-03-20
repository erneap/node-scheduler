import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeLeavesChartHolidays } from './employee-leaves-chart-holidays';

describe('EmployeeLeavesChartHolidays', () => {
  let component: EmployeeLeavesChartHolidays;
  let fixture: ComponentFixture<EmployeeLeavesChartHolidays>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeLeavesChartHolidays],
    }).compileComponents();

    fixture = TestBed.createComponent(EmployeeLeavesChartHolidays);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
