import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TeamEditorWorkcodes } from './team-editor-workcodes';

describe('TeamEditorWorkcodes', () => {
  let component: TeamEditorWorkcodes;
  let fixture: ComponentFixture<TeamEditorWorkcodes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeamEditorWorkcodes],
    }).compileComponents();

    fixture = TestBed.createComponent(TeamEditorWorkcodes);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
