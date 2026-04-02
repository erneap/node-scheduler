import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TeamQueryContact } from './team-query-contact';

describe('TeamQueryContact', () => {
  let component: TeamQueryContact;
  let fixture: ComponentFixture<TeamQueryContact>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeamQueryContact],
    }).compileComponents();

    fixture = TestBed.createComponent(TeamQueryContact);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
