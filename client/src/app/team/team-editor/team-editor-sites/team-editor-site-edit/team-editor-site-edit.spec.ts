import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TeamEditorSiteEdit } from './team-editor-site-edit';

describe('TeamEditorSiteEdit', () => {
  let component: TeamEditorSiteEdit;
  let fixture: ComponentFixture<TeamEditorSiteEdit>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeamEditorSiteEdit],
    }).compileComponents();

    fixture = TestBed.createComponent(TeamEditorSiteEdit);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
