import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeLeavesChart } from './employee-leaves-chart';

describe('EmployeeLeavesChart', () => {
  let component: EmployeeLeavesChart;
  let fixture: ComponentFixture<EmployeeLeavesChart>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeLeavesChart],
    }).compileComponents();

    fixture = TestBed.createComponent(EmployeeLeavesChart);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
