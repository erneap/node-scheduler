import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TeamEditorSiteNewPersonnel } from './team-editor-site-new-personnel';

describe('TeamEditorSiteNewPersonnel', () => {
  let component: TeamEditorSiteNewPersonnel;
  let fixture: ComponentFixture<TeamEditorSiteNewPersonnel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeamEditorSiteNewPersonnel],
    }).compileComponents();

    fixture = TestBed.createComponent(TeamEditorSiteNewPersonnel);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
