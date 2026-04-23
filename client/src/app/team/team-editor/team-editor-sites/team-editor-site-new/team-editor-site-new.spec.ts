import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TeamEditorSiteNew } from './team-editor-site-new';

describe('TeamEditorSiteNew', () => {
  let component: TeamEditorSiteNew;
  let fixture: ComponentFixture<TeamEditorSiteNew>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeamEditorSiteNew],
    }).compileComponents();

    fixture = TestBed.createComponent(TeamEditorSiteNew);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
