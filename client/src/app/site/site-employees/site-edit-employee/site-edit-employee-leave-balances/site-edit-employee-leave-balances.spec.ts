import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SiteEditEmployeeLeaveBalances } from './site-edit-employee-leave-balances';

describe('SiteEditEmployeeLeaveBalances', () => {
  let component: SiteEditEmployeeLeaveBalances;
  let fixture: ComponentFixture<SiteEditEmployeeLeaveBalances>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteEditEmployeeLeaveBalances],
    }).compileComponents();

    fixture = TestBed.createComponent(SiteEditEmployeeLeaveBalances);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
