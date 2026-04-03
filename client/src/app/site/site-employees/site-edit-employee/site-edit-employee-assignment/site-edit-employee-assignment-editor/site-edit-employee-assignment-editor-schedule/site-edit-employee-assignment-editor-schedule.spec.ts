import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SiteEditEmployeeAssignmentEditorSchedule } from './site-edit-employee-assignment-editor-schedule';

describe('SiteEditEmployeeAssignmentEditorSchedule', () => {
  let component: SiteEditEmployeeAssignmentEditorSchedule;
  let fixture: ComponentFixture<SiteEditEmployeeAssignmentEditorSchedule>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteEditEmployeeAssignmentEditorSchedule],
    }).compileComponents();

    fixture = TestBed.createComponent(SiteEditEmployeeAssignmentEditorSchedule);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
