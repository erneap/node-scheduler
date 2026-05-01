import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminTeamsNewPersonnel } from './admin-teams-new-personnel';

describe('AdminTeamsNewPersonnel', () => {
  let component: AdminTeamsNewPersonnel;
  let fixture: ComponentFixture<AdminTeamsNewPersonnel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminTeamsNewPersonnel],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminTeamsNewPersonnel);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
