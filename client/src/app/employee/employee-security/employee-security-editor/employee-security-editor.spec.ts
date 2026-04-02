import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeSecurityEditor } from './employee-security-editor';

describe('EmployeeSecurityEditor', () => {
  let component: EmployeeSecurityEditor;
  let fixture: ComponentFixture<EmployeeSecurityEditor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeSecurityEditor],
    }).compileComponents();

    fixture = TestBed.createComponent(EmployeeSecurityEditor);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
