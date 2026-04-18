import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TeamEditorCompaniesModtime } from './team-editor-companies-modtime';

describe('TeamEditorCompaniesModtime', () => {
  let component: TeamEditorCompaniesModtime;
  let fixture: ComponentFixture<TeamEditorCompaniesModtime>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeamEditorCompaniesModtime],
    }).compileComponents();

    fixture = TestBed.createComponent(TeamEditorCompaniesModtime);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
