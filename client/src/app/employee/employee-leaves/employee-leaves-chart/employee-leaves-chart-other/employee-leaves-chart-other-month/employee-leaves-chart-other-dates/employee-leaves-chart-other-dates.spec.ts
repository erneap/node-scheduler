import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeLeavesChartOtherDates } from './employee-leaves-chart-other-dates';

describe('EmployeeLeavesChartOtherDates', () => {
  let component: EmployeeLeavesChartOtherDates;
  let fixture: ComponentFixture<EmployeeLeavesChartOtherDates>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeLeavesChartOtherDates],
    }).compileComponents();

    fixture = TestBed.createComponent(EmployeeLeavesChartOtherDates);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
