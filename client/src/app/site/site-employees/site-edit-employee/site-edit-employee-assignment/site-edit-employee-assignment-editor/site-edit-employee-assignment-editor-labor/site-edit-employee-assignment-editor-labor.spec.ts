import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SiteEditEmployeeAssignmentEditorLabor } from './site-edit-employee-assignment-editor-labor';

describe('SiteEditEmployeeAssignmentEditorLabor', () => {
  let component: SiteEditEmployeeAssignmentEditorLabor;
  let fixture: ComponentFixture<SiteEditEmployeeAssignmentEditorLabor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteEditEmployeeAssignmentEditorLabor],
    }).compileComponents();

    fixture = TestBed.createComponent(SiteEditEmployeeAssignmentEditorLabor);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
