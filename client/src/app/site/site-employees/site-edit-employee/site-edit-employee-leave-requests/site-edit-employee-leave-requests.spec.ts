import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SiteEditEmployeeLeaveRequests } from './site-edit-employee-leave-requests';

describe('SiteEditEmployeeLeaveRequests', () => {
  let component: SiteEditEmployeeLeaveRequests;
  let fixture: ComponentFixture<SiteEditEmployeeLeaveRequests>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteEditEmployeeLeaveRequests],
    }).compileComponents();

    fixture = TestBed.createComponent(SiteEditEmployeeLeaveRequests);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
