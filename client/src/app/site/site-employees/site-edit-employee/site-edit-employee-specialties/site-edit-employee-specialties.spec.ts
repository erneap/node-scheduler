import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SiteEditEmployeeSpecialties } from './site-edit-employee-specialties';

describe('SiteEditEmployeeSpecialties', () => {
  let component: SiteEditEmployeeSpecialties;
  let fixture: ComponentFixture<SiteEditEmployeeSpecialties>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteEditEmployeeSpecialties],
    }).compileComponents();

    fixture = TestBed.createComponent(SiteEditEmployeeSpecialties);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
