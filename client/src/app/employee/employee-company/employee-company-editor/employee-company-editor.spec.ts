import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeCompanyEditor } from './employee-company-editor';

describe('EmployeeCompanyEditor', () => {
  let component: EmployeeCompanyEditor;
  let fixture: ComponentFixture<EmployeeCompanyEditor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeCompanyEditor],
    }).compileComponents();

    fixture = TestBed.createComponent(EmployeeCompanyEditor);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
