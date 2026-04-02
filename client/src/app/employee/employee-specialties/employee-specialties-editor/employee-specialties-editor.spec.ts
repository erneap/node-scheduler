import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeSpecialtiesEditor } from './employee-specialties-editor';

describe('EmployeeSpecialtiesEditor', () => {
  let component: EmployeeSpecialtiesEditor;
  let fixture: ComponentFixture<EmployeeSpecialtiesEditor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeSpecialtiesEditor],
    }).compileComponents();

    fixture = TestBed.createComponent(EmployeeSpecialtiesEditor);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
