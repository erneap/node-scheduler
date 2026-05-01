import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminTeamsEditDisplay } from './admin-teams-edit-display';

describe('AdminTeamsEditDisplay', () => {
  let component: AdminTeamsEditDisplay;
  let fixture: ComponentFixture<AdminTeamsEditDisplay>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminTeamsEditDisplay],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminTeamsEditDisplay);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
