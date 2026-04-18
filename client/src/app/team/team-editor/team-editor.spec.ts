import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TeamEditor } from './team-editor';

describe('TeamEditor', () => {
  let component: TeamEditor;
  let fixture: ComponentFixture<TeamEditor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeamEditor],
    }).compileComponents();

    fixture = TestBed.createComponent(TeamEditor);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
