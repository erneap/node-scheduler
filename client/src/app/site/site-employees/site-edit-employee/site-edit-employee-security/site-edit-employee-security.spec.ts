import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SiteEditEmployeeSecurity } from './site-edit-employee-security';

describe('SiteEditEmployeeSecurity', () => {
  let component: SiteEditEmployeeSecurity;
  let fixture: ComponentFixture<SiteEditEmployeeSecurity>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteEditEmployeeSecurity],
    }).compileComponents();

    fixture = TestBed.createComponent(SiteEditEmployeeSecurity);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
