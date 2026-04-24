import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SiteEditEmployeePermissions } from './site-edit-employee-permissions';

describe('SiteEditEmployeePermissions', () => {
  let component: SiteEditEmployeePermissions;
  let fixture: ComponentFixture<SiteEditEmployeePermissions>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteEditEmployeePermissions],
    }).compileComponents();

    fixture = TestBed.createComponent(SiteEditEmployeePermissions);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
