import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminTeamsNew } from './admin-teams-new';

describe('AdminTeamsNew', () => {
  let component: AdminTeamsNew;
  let fixture: ComponentFixture<AdminTeamsNew>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminTeamsNew],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminTeamsNew);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
