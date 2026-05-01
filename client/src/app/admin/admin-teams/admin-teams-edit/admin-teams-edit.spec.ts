import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminTeamsEdit } from './admin-teams-edit';

describe('AdminTeamsEdit', () => {
  let component: AdminTeamsEdit;
  let fixture: ComponentFixture<AdminTeamsEdit>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminTeamsEdit],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminTeamsEdit);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
