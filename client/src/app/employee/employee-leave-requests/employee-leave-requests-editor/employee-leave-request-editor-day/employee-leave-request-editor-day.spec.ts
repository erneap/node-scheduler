import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeLeaveRequestEditorDay } from './employee-leave-request-editor-day';

describe('EmployeeLeaveRequestEditorDay', () => {
  let component: EmployeeLeaveRequestEditorDay;
  let fixture: ComponentFixture<EmployeeLeaveRequestEditorDay>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeLeaveRequestEditorDay],
    }).compileComponents();

    fixture = TestBed.createComponent(EmployeeLeaveRequestEditorDay);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
