import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TeamEditorCompaniesHolidays } from './team-editor-companies-holidays';

describe('TeamEditorCompaniesHolidays', () => {
  let component: TeamEditorCompaniesHolidays;
  let fixture: ComponentFixture<TeamEditorCompaniesHolidays>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeamEditorCompaniesHolidays],
    }).compileComponents();

    fixture = TestBed.createComponent(TeamEditorCompaniesHolidays);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
