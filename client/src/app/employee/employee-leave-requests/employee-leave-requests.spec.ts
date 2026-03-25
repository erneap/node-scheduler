import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeLeaveRequests } from './employee-leave-requests';

describe('EmployeeLeaveRequests', () => {
  let component: EmployeeLeaveRequests;
  let fixture: ComponentFixture<EmployeeLeaveRequests>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeLeaveRequests],
    }).compileComponents();

    fixture = TestBed.createComponent(EmployeeLeaveRequests);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
