import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SiteEditEmployeeProfile } from './site-edit-employee-profile';

describe('SiteEditEmployeeProfile', () => {
  let component: SiteEditEmployeeProfile;
  let fixture: ComponentFixture<SiteEditEmployeeProfile>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteEditEmployeeProfile],
    }).compileComponents();

    fixture = TestBed.createComponent(SiteEditEmployeeProfile);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
