import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SiteEditEmployeeAssignmentEditorWorkday } from './site-edit-employee-assignment-editor-workday';

describe('SiteEditEmployeeAssignmentEditorWorkday', () => {
  let component: SiteEditEmployeeAssignmentEditorWorkday;
  let fixture: ComponentFixture<SiteEditEmployeeAssignmentEditorWorkday>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteEditEmployeeAssignmentEditorWorkday],
    }).compileComponents();

    fixture = TestBed.createComponent(SiteEditEmployeeAssignmentEditorWorkday);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
