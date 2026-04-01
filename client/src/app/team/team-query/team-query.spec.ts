import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TeamQuery } from './team-query';

describe('TeamQuery', () => {
  let component: TeamQuery;
  let fixture: ComponentFixture<TeamQuery>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeamQuery],
    }).compileComponents();

    fixture = TestBed.createComponent(TeamQuery);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
