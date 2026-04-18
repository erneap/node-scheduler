import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TeamEditorContacts } from './team-editor-contacts';

describe('TeamEditorContacts', () => {
  let component: TeamEditorContacts;
  let fixture: ComponentFixture<TeamEditorContacts>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeamEditorContacts],
    }).compileComponents();

    fixture = TestBed.createComponent(TeamEditorContacts);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
