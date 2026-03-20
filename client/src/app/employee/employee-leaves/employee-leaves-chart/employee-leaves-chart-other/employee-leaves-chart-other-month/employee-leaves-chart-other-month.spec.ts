import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeLeavesChartOtherMonth } from './employee-leaves-chart-other-month';

describe('EmployeeLeavesChartOtherMonth', () => {
  let component: EmployeeLeavesChartOtherMonth;
  let fixture: ComponentFixture<EmployeeLeavesChartOtherMonth>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeLeavesChartOtherMonth],
    }).compileComponents();

    fixture = TestBed.createComponent(EmployeeLeavesChartOtherMonth);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
