import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeLeaveRequestsEditor } from './employee-leave-requests-editor';

describe('EmployeeLeaveRequestsEditor', () => {
  let component: EmployeeLeaveRequestsEditor;
  let fixture: ComponentFixture<EmployeeLeaveRequestsEditor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeLeaveRequestsEditor],
    }).compileComponents();

    fixture = TestBed.createComponent(EmployeeLeaveRequestsEditor);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
