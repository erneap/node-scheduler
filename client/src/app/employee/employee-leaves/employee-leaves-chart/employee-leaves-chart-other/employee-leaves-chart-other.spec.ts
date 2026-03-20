import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeLeavesChartOther } from './employee-leaves-chart-other';

describe('EmployeeLeavesChartOther', () => {
  let component: EmployeeLeavesChartOther;
  let fixture: ComponentFixture<EmployeeLeavesChartOther>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeLeavesChartOther],
    }).compileComponents();

    fixture = TestBed.createComponent(EmployeeLeavesChartOther);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
