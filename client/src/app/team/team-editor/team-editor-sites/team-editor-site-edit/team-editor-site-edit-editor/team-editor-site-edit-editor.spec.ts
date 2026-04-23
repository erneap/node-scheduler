import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TeamEditorSiteEditEditor } from './team-editor-site-edit-editor';

describe('TeamEditorSiteEditEditor', () => {
  let component: TeamEditorSiteEditEditor;
  let fixture: ComponentFixture<TeamEditorSiteEditEditor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeamEditorSiteEditEditor],
    }).compileComponents();

    fixture = TestBed.createComponent(TeamEditorSiteEditEditor);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
