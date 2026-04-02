import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SiteEditEmployeePTO } from './site-edit-employee-pto';

describe('SiteEditEmployeePTO', () => {
  let component: SiteEditEmployeePTO;
  let fixture: ComponentFixture<SiteEditEmployeePTO>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteEditEmployeePTO],
    }).compileComponents();

    fixture = TestBed.createComponent(SiteEditEmployeePTO);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
