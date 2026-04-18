import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TeamEditorCompanies } from './team-editor-companies';

describe('TeamEditorCompanies', () => {
  let component: TeamEditorCompanies;
  let fixture: ComponentFixture<TeamEditorCompanies>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeamEditorCompanies],
    }).compileComponents();

    fixture = TestBed.createComponent(TeamEditorCompanies);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
