import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeLeaveRequestsViewer } from './employee-leave-requests-viewer';

describe('EmployeeLeaveRequestsViewer', () => {
  let component: EmployeeLeaveRequestsViewer;
  let fixture: ComponentFixture<EmployeeLeaveRequestsViewer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeLeaveRequestsViewer],
    }).compileComponents();

    fixture = TestBed.createComponent(EmployeeLeaveRequestsViewer);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
