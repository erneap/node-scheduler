import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SiteEditEmployeeLeaveBalancesChart } from './site-edit-employee-leave-balances-chart';

describe('SiteEditEmployeeLeaveBalancesChart', () => {
  let component: SiteEditEmployeeLeaveBalancesChart;
  let fixture: ComponentFixture<SiteEditEmployeeLeaveBalancesChart>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteEditEmployeeLeaveBalancesChart],
    }).compileComponents();

    fixture = TestBed.createComponent(SiteEditEmployeeLeaveBalancesChart);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
