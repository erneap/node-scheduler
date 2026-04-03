import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SiteEditEmployeeAssignment } from './site-edit-employee-assignment';

describe('SiteEditEmployeeAssignment', () => {
  let component: SiteEditEmployeeAssignment;
  let fixture: ComponentFixture<SiteEditEmployeeAssignment>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteEditEmployeeAssignment],
    }).compileComponents();

    fixture = TestBed.createComponent(SiteEditEmployeeAssignment);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
