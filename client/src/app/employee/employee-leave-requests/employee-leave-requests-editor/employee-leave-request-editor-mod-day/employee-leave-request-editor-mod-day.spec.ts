import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeLeaveRequestEditorModDay } from './employee-leave-request-editor-mod-day';

describe('EmployeeLeaveRequestEditorModDay', () => {
  let component: EmployeeLeaveRequestEditorModDay;
  let fixture: ComponentFixture<EmployeeLeaveRequestEditorModDay>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeLeaveRequestEditorModDay],
    }).compileComponents();

    fixture = TestBed.createComponent(EmployeeLeaveRequestEditorModDay);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
