import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SiteEditEmployeeAssignmentEditorLaborCode } from './site-edit-employee-assignment-editor-labor-code';

describe('SiteEditEmployeeAssignmentEditorLaborCode', () => {
  let component: SiteEditEmployeeAssignmentEditorLaborCode;
  let fixture: ComponentFixture<SiteEditEmployeeAssignmentEditorLaborCode>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteEditEmployeeAssignmentEditorLaborCode],
    }).compileComponents();

    fixture = TestBed.createComponent(SiteEditEmployeeAssignmentEditorLaborCode);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
