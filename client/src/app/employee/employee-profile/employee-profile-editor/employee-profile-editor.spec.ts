import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeProfileEditor } from './employee-profile-editor';

describe('EmployeeProfileEditor', () => {
  let component: EmployeeProfileEditor;
  let fixture: ComponentFixture<EmployeeProfileEditor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeProfileEditor],
    }).compileComponents();

    fixture = TestBed.createComponent(EmployeeProfileEditor);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
