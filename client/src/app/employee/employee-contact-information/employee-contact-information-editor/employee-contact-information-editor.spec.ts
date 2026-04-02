import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeContactInformationEditor } from './employee-contact-information-editor';

describe('EmployeeContactInformationEditor', () => {
  let component: EmployeeContactInformationEditor;
  let fixture: ComponentFixture<EmployeeContactInformationEditor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeContactInformationEditor],
    }).compileComponents();

    fixture = TestBed.createComponent(EmployeeContactInformationEditor);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
