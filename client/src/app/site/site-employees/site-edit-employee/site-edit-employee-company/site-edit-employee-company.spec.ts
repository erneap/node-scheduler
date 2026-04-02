import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SiteEditEmployeeCompany } from './site-edit-employee-company';

describe('SiteEditEmployeeCompany', () => {
  let component: SiteEditEmployeeCompany;
  let fixture: ComponentFixture<SiteEditEmployeeCompany>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteEditEmployeeCompany],
    }).compileComponents();

    fixture = TestBed.createComponent(SiteEditEmployeeCompany);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
