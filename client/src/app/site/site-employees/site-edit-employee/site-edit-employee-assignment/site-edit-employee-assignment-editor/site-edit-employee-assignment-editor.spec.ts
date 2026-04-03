import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SiteEditEmployeeAssignmentEditor } from './site-edit-employee-assignment-editor';

describe('SiteEditEmployeeAssignmentEditor', () => {
  let component: SiteEditEmployeeAssignmentEditor;
  let fixture: ComponentFixture<SiteEditEmployeeAssignmentEditor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteEditEmployeeAssignmentEditor],
    }).compileComponents();

    fixture = TestBed.createComponent(SiteEditEmployeeAssignmentEditor);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
