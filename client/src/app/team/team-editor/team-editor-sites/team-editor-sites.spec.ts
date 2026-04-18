import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TeamEditorSites } from './team-editor-sites';

describe('TeamEditorSites', () => {
  let component: TeamEditorSites;
  let fixture: ComponentFixture<TeamEditorSites>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeamEditorSites],
    }).compileComponents();

    fixture = TestBed.createComponent(TeamEditorSites);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
