import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TeamEditorSpecialties } from './team-editor-specialties';

describe('TeamEditorSpecialties', () => {
  let component: TeamEditorSpecialties;
  let fixture: ComponentFixture<TeamEditorSpecialties>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeamEditorSpecialties],
    }).compileComponents();

    fixture = TestBed.createComponent(TeamEditorSpecialties);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
