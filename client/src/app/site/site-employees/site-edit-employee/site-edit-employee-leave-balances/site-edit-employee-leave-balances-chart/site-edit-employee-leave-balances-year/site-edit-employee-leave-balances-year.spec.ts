import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SiteEditEmployeeLeaveBalancesYear } from './site-edit-employee-leave-balances-year';

describe('SiteEditEmployeeLeaveBalancesYear', () => {
  let component: SiteEditEmployeeLeaveBalancesYear;
  let fixture: ComponentFixture<SiteEditEmployeeLeaveBalancesYear>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteEditEmployeeLeaveBalancesYear],
    }).compileComponents();

    fixture = TestBed.createComponent(SiteEditEmployeeLeaveBalancesYear);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
